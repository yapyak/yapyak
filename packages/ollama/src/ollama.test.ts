import { afterEach, describe, expect, it, vi } from 'vitest';

import { ollama } from './ollama';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(text: string): {
  body: () => unknown;
  url: () => string;
} {
  let captured: {
    body: unknown;
    url: string;
  } = {
    body: undefined,
    url: '',
  };
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    captured = {
      body: JSON.parse(init.body as string),
      url,
    };
    return new Response(
      JSON.stringify({
        response: JSON.stringify([
          {
            sv: text,
          },
        ]),
      }),
      {
        status: 200,
      },
    );
  });
  return {
    body: () => captured.body,
    url: () => captured.url,
  };
}

describe('ollama', () => {
  it('returns translated text trimmed', async () => {
    stubFetch('  Hej  ');
    const result = await ollama()({
      fileId: 'src/a.tsx',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(result).toBe('Hej');
  });

  it('builds requests with `llama3.1` as default model', async () => {
    const stub = stubFetch('Hej');
    await ollama()({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(
      (
        stub.body() as {
          model: string;
        }
      ).model,
    ).toBe('llama3.1');
  });

  it('builds requests with the configured model when set', async () => {
    const stub = stubFetch('Hej');
    await ollama({
      model: 'qwen2.5',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(
      (
        stub.body() as {
          model: string;
        }
      ).model,
    ).toBe('qwen2.5');
  });

  it('builds requests against `http://localhost:11434/api/generate` by default', async () => {
    const stub = stubFetch('Hej');
    await ollama()({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.url()).toBe('http://localhost:11434/api/generate');
  });

  it('builds requests against the configured endpoint when set', async () => {
    const stub = stubFetch('Hej');
    await ollama({
      endpoint: 'http://gpu.local:11434/api/generate',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.url()).toBe('http://gpu.local:11434/api/generate');
  });

  it('builds requests with `format: json` and `stream: false`', async () => {
    const stub = stubFetch('Hej');
    await ollama()({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const body = stub.body() as {
      format: string;
      stream: boolean;
    };
    expect(body.format).toBe('json');
    expect(body.stream).toBe(false);
  });

  it('builds the system prompt into the top-level `system` field', async () => {
    const stub = stubFetch('Hej');
    await ollama({
      voice: 'Casual, never corporate',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(
      (
        stub.body() as {
          system: string;
        }
      ).system,
    ).toContain('Casual, never corporate');
  });

  it('throws when the API responds with non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response('unavailable', {
          status: 503,
        }),
    );
    await expect(
      ollama()({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/503/);
  });

  it('throws when the response holds no `response` field', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(JSON.stringify({}), {
          status: 200,
        }),
    );
    await expect(
      ollama()({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/response field/);
  });

  it('throws a truncation error when `done_reason` is `length`', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            done_reason: 'length',
            response: '[{"sv": "Hej"',
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      ollama()({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/truncated by token limit/);
  });

  it('writes `maxTokens` to `options.num_predict` when set', async () => {
    let capturedBody:
      | {
          options?: {
            num_predict?: number;
          };
        }
      | undefined;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string) as {
        options?: {
          num_predict?: number;
        };
      };
      return new Response(
        JSON.stringify({
          response: JSON.stringify([
            {
              sv: 'Hej',
            },
          ]),
        }),
        {
          status: 200,
        },
      );
    });
    await ollama({
      maxTokens: 4096,
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(capturedBody?.options?.num_predict).toBe(4096);
  });

  it('omits `num_predict` from `options` when `maxTokens` is not set', async () => {
    let capturedBody:
      | {
          options?: Record<string, unknown>;
        }
      | undefined;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string) as {
        options?: Record<string, unknown>;
      };
      return new Response(
        JSON.stringify({
          response: JSON.stringify([
            {
              sv: 'Hej',
            },
          ]),
        }),
        {
          status: 200,
        },
      );
    });
    await ollama()({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(capturedBody?.options).not.toHaveProperty('num_predict');
  });
});
