import { afterEach, describe, expect, it, vi } from 'vitest';

import { openai } from './openai';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(text: string): {
  body: () => unknown;
  headers: () => Record<string, string>;
  url: () => string;
} {
  let captured: {
    body: unknown;
    headers: Record<string, string>;
    url: string;
  } = {
    body: undefined,
    headers: {},
    url: '',
  };
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    captured = {
      body: JSON.parse(init.body as string),
      headers: init.headers as Record<string, string>,
      url,
    };
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  sv: text,
                },
              ]),
              role: 'assistant',
            },
          },
        ],
      }),
      {
        status: 200,
      },
    );
  });
  return {
    body: () => captured.body,
    headers: () => captured.headers,
    url: () => captured.url,
  };
}

describe('openai', () => {
  it('returns translated text trimmed', async () => {
    stubFetch('  Hej  ');
    const result = await openai({
      apiKey: 'k',
    })({
      fileId: 'src/a.tsx',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(result).toBe('Hej');
  });

  it('writes the API key as `authorization: Bearer` header', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'sk-test',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.headers().authorization).toBe('Bearer sk-test');
  });

  it('builds requests with `gpt-5-mini` as default model', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
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
    ).toBe('gpt-5-mini');
  });

  it('builds requests with the configured model when set', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      model: 'gpt-5',
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
    ).toBe('gpt-5');
  });

  it('writes no `temperature` for a reasoning model like the default `gpt-5-mini`', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.body() as Record<string, unknown>).not.toHaveProperty(
      'temperature',
    );
  });

  it('writes `temperature` to the request body for a non-reasoning model like `gpt-4o`', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      model: 'gpt-4o',
      temperature: 0.5,
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const body = stub.body() as {
      temperature?: number;
    };
    expect(body.temperature).toBe(0.5);
  });

  it('builds requests against the configured endpoint when set', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      endpoint: 'https://proxy.example.com/v1/chat/completions',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.url()).toBe('https://proxy.example.com/v1/chat/completions');
  });

  it('builds the system prompt as the first `system` message', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      voice: 'Casual, never corporate',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const body = stub.body() as {
      messages: Array<{
        content: string;
        role: string;
      }>;
    };
    expect(body.messages[0]?.role).toBe('system');
    expect(body.messages[0]?.content).toContain('Casual, never corporate');
  });

  it('writes the `OpenAI-Organization` header when `organization` is set', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      organization: 'org-test',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.headers()['OpenAI-Organization']).toBe('org-test');
  });

  it('builds requests with `seed` in the body when set', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      seed: 42,
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(
      (
        stub.body() as {
          seed?: number;
        }
      ).seed,
    ).toBe(42);
  });

  it('builds requests with `user` in the body when set', async () => {
    const stub = stubFetch('Hej');
    await openai({
      apiKey: 'k',
      user: 'u-1',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(
      (
        stub.body() as {
          user?: string;
        }
      ).user,
    ).toBe('u-1');
  });

  it('parses translation from a markdown-fenced JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '```json\n[{"sv": "Hej"}]\n```',
                  role: 'assistant',
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    const result = await openai({
      apiKey: 'k',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(result).toBe('Hej');
  });

  it('throws when the API responds with non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response('rate limited', {
          status: 429,
        }),
    );
    await expect(
      openai({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/429/);
  });

  it('throws a truncation error when `finish_reason` is `length`', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: 'length',
                message: {
                  content: '[{"sv": "Hej"',
                  role: 'assistant',
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      openai({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/truncated by token limit/);
  });

  it('throws when `apiKey` is an empty string', () => {
    expect(() =>
      openai({
        apiKey: '',
      }),
    ).toThrow(/apiKey is required/);
  });
});
