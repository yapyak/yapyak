import { afterEach, describe, expect, it, vi } from 'vitest';

import { gemini } from './gemini';

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
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      sv: text,
                    },
                  ]),
                },
              ],
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

describe('gemini', () => {
  it('returns translated text trimmed', async () => {
    stubFetch('  Hej  ');
    const translator = gemini({
      apiKey: 'k',
    });
    const result = await translator({
      fileId: 'src/a.tsx',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(result).toBe('Hej');
  });

  it('writes the API key as `x-goog-api-key` header', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'gk-test',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.headers()['x-goog-api-key']).toBe('gk-test');
  });

  it('builds requests with `gemini-2.5-flash` as default model', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'k',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.url()).toContain('/models/gemini-2.5-flash:generateContent');
  });

  it('builds requests with the configured model when set', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'k',
      model: 'gemini-2.5-pro',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.url()).toContain('/models/gemini-2.5-pro:generateContent');
  });

  it('builds requests against the configured endpoint when set', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'k',
      endpoint: 'https://proxy.example.com/v1beta',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.url()).toBe(
      'https://proxy.example.com/v1beta/models/gemini-2.5-flash:generateContent',
    );
  });

  it('builds the system prompt into `systemInstruction.parts[0].text`', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'k',
      voice: 'Casual, never corporate',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const body = stub.body() as {
      systemInstruction: {
        parts: {
          text: string;
        }[];
      };
    };
    expect(body.systemInstruction.parts[0]?.text).toContain(
      'Casual, never corporate',
    );
  });

  it('parses translation from a markdown-fenced JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '```json\n[{"sv": "Hej"}]\n```',
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    const result = await gemini({
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
      gemini({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/429/);
  });

  it('throws a truncation error when `finishReason` is `MAX_TOKENS`', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '[{"sv": "Hej"',
                    },
                  ],
                },
                finishReason: 'MAX_TOKENS',
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      gemini({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/truncated by token limit/);
  });

  it('throws when the response holds no text part', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [],
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      gemini({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/text part/);
  });

  it('throws a safety-filter error when `finishReason` is `SAFETY`', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: 'SAFETY',
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      gemini({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/blocked by Gemini safety filter/);
  });

  it('throws a recitation-filter error when `finishReason` is `RECITATION`', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: 'RECITATION',
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    await expect(
      gemini({
        apiKey: 'k',
      })({
        fileId: 'x',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/blocked by Gemini recitation filter/);
  });

  it('writes `maxTokens` to `generationConfig.maxOutputTokens` when set', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'k',
      maxTokens: 4096,
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const body = stub.body() as {
      generationConfig: {
        maxOutputTokens?: number;
      };
    };
    expect(body.generationConfig.maxOutputTokens).toBe(4096);
  });

  it('omits `maxOutputTokens` from the request when `maxTokens` is not set', async () => {
    const stub = stubFetch('Hej');
    await gemini({
      apiKey: 'k',
    })({
      fileId: 'x',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const body = stub.body() as {
      generationConfig: Record<string, unknown>;
    };
    expect(body.generationConfig).not.toHaveProperty('maxOutputTokens');
  });

  it('throws when `apiKey` is an empty string', () => {
    expect(() =>
      gemini({
        apiKey: '',
      }),
    ).toThrow(/apiKey is required/);
  });
});
