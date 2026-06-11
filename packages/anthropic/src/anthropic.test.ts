import { afterEach, describe, expect, it, vi } from 'vitest';

import { anthropic } from './anthropic';

afterEach(() => {
  vi.unstubAllGlobals();
});

const POOL: Record<string, string> = {
  Cancel: 'Avbryt',
  Hello: 'Hej',
  'Loading...': 'Laddar...',
  Save: 'Spara',
  'Save changes': 'Spara ändringar',
  Settings: 'Inställningar',
  'Switch account': 'Byt konto',
  'Unnamed account': 'Namnlöst konto',
  World: 'Världen',
};

function stubFetch(text: string): {
  body: () => unknown;
  headers: () => Record<string, string>;
} {
  let captured: {
    body: unknown;
    headers: Record<string, string>;
  } = {
    body: undefined,
    headers: {},
  };
  vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
    captured = {
      body: JSON.parse(init.body as string),
      headers: init.headers as Record<string, string>,
    };
    return new Response(
      JSON.stringify({
        content: [
          {
            text: JSON.stringify([
              {
                sv: text,
              },
            ]),
            type: 'text',
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
  };
}

describe('anthropic', () => {
  it('returns translated text trimmed', async () => {
    stubFetch('  Hej  ');
    const translator = anthropic({
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

  it('writes the API key as `x-api-key` header', async () => {
    const stub = stubFetch('Hej');
    await anthropic({
      apiKey: 'sk-test',
    })({
      fileId: 'src/a.tsx',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.headers()['x-api-key']).toBe('sk-test');
  });

  it('builds requests with `claude-sonnet-4-6` as default model', async () => {
    const stub = stubFetch('Hej');
    await anthropic({
      apiKey: 'k',
    })({
      fileId: 'src/a.tsx',
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
    ).toBe('claude-sonnet-4-6');
  });

  it('builds requests with the configured model when set', async () => {
    const stub = stubFetch('Hej');
    await anthropic({
      apiKey: 'k',
      model: 'claude-opus-4-7',
    })({
      fileId: 'src/a.tsx',
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
    ).toBe('claude-opus-4-7');
  });

  it('builds system prompt with the configured voice', async () => {
    const stub = stubFetch('Hej');
    await anthropic({
      apiKey: 'k',
      voice: 'Switch account',
    })({
      fileId: 'src/a.tsx',
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
    ).toContain('Switch account');
  });

  it('builds system prompt with matching glossary entries', async () => {
    const stub = stubFetch('Byt konto');
    await anthropic({
      apiKey: 'k',
      glossary: {
        'Switch account': {
          fr: 'Changer de compte',
          sv: 'Byt konto',
        },
      },
    })({
      fileId: 'src/a.tsx',
      source: 'Switch account',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (
      stub.body() as {
        system: string;
      }
    ).system;
    expect(system).toContain('"Switch account" → sv="Byt konto"');
    expect(system).not.toContain('Changer de compte');
  });

  it('builds system prompt with placeholder preservation reminder', async () => {
    const stub = stubFetch('Hej {name}');
    await anthropic({
      apiKey: 'k',
    })({
      fileId: 'src/a.tsx',
      source: 'Hi {name}',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (
      stub.body() as {
        system: string;
      }
    ).system;
    expect(system).toContain('{placeholder}');
  });

  it('builds requests against the configured endpoint when set', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', async (url: string) => {
      capturedUrl = url;
      return new Response(
        JSON.stringify({
          content: [
            {
              text: JSON.stringify([
                {
                  sv: 'Hej',
                },
              ]),
              type: 'text',
            },
          ],
        }),
        {
          status: 200,
        },
      );
    });
    await anthropic({
      apiKey: 'k',
      endpoint: 'https://proxy.example.com/messages',
    })({
      fileId: 'src/a.tsx',
      source: 'Hello',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(capturedUrl).toBe('https://proxy.example.com/messages');
  });

  it('parses translation from markdown-fenced JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            content: [
              {
                text: '```json\n[{"sv": "Hej"}]\n```',
                type: 'text',
              },
            ],
          }),
          {
            status: 200,
          },
        ),
    );
    const translator = anthropic({
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

  it('throws when `apiKey` is `undefined`', () => {
    expect(() =>
      anthropic({
        apiKey: undefined as unknown as string,
      }),
    ).toThrow(/apiKey is required, received undefined/);
  });

  it('throws when `apiKey` is an empty string', () => {
    expect(() =>
      anthropic({
        apiKey: '',
      }),
    ).toThrow(/apiKey is required, received empty string/);
  });

  it('throws when the API response has no text block', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            content: [],
          }),
          {
            status: 200,
          },
        ),
    );
    const translator = anthropic({
      apiKey: 'k',
    });
    await expect(
      translator({
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/did not contain a text block/);
  });

  it('throws when the API responds with non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response('rate limited', {
          status: 429,
        }),
    );
    const translator = anthropic({
      apiKey: 'k',
    });
    await expect(
      translator({
        fileId: 'src/a.tsx',
        source: 'Hello',
        sourceLocale: 'en',
        targetLocale: 'sv',
      }),
    ).rejects.toThrow(/429/);
  });

  describe('batch', () => {
    it('returns all translations in a single call', async () => {
      let calls = 0;
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        calls++;
        const body = JSON.parse(init.body as string);
        const items: {
          source: string;
        }[] = JSON.parse(body.messages[0].content);
        const translations = items.map((item) => ({
          sv: POOL[item.source] ?? '',
        }));
        return new Response(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify(translations),
                type: 'text',
              },
            ],
          }),
          {
            status: 200,
          },
        );
      });
      const translator = anthropic({
        apiKey: 'k',
      });
      const results = await translator.batch?.([
        {
          fileId: 'src/a.tsx',
          source: 'Hello',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
        {
          fileId: 'src/a.tsx',
          source: 'Save',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]);
      expect(results).toEqual([
        'Hej',
        'Spara',
      ]);
      expect(calls).toBe(1);
    });

    it('transforms requests into smaller batches when above `batchSize`', async () => {
      let calls = 0;
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        calls++;
        const body = JSON.parse(init.body as string);
        const items: {
          source: string;
        }[] = JSON.parse(body.messages[0].content);
        return new Response(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify(
                  items.map((item) => ({
                    sv: POOL[item.source] ?? '',
                  })),
                ),
                type: 'text',
              },
            ],
          }),
          {
            status: 200,
          },
        );
      });
      const translator = anthropic({
        apiKey: 'k',
        batchSize: 3,
      });
      const sources = [
        'Hello',
        'World',
        'Save',
        'Save changes',
        'Cancel',
        'Settings',
        'Loading...',
      ];
      const requests = sources.map((source) => ({
        fileId: 'src/a.tsx',
        source,
        sourceLocale: 'en',
        targetLocale: 'sv',
      }));
      const results = await translator.batch?.(requests);
      expect(results?.length).toBe(7);
      expect(calls).toBe(3);
    });

    it('preserves order when later chunks resolve before earlier chunks', async () => {
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        const items: {
          source: string;
        }[] = JSON.parse(body.messages[0].content);
        const isFirstChunk = items[0]?.source === 'Hello';
        const delay = isFirstChunk ? 30 : 0;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return new Response(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify(
                  items.map((item) => ({
                    sv: POOL[item.source] ?? '',
                  })),
                ),
                type: 'text',
              },
            ],
          }),
          {
            status: 200,
          },
        );
      });
      const translator = anthropic({
        apiKey: 'k',
        batchSize: 2,
        concurrency: 3,
      });
      const sources = [
        'Hello',
        'World',
        'Save',
        'Save changes',
        'Cancel',
        'Settings',
      ];
      const requests = sources.map((source) => ({
        fileId: 'src/a.tsx',
        source,
        sourceLocale: 'en',
        targetLocale: 'sv',
      }));
      const results = await translator.batch?.(requests);
      expect(results).toEqual([
        'Hej',
        'Världen',
        'Spara',
        'Spara ändringar',
        'Avbryt',
        'Inställningar',
      ]);
    });

    it('notifies onChunk after each chunk completes', async () => {
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        const items: {
          source: string;
        }[] = JSON.parse(body.messages[0].content);
        return new Response(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify(
                  items.map((item) => ({
                    sv: POOL[item.source] ?? '',
                  })),
                ),
                type: 'text',
              },
            ],
          }),
          {
            status: 200,
          },
        );
      });
      const translator = anthropic({
        apiKey: 'k',
        batchSize: 2,
        concurrency: 2,
      });
      const sources = [
        'Hello',
        'World',
        'Save',
        'Save changes',
        'Cancel',
        'Settings',
        'Loading...',
      ];
      const requests = sources.map((source) => ({
        fileId: 'src/a.tsx',
        source,
        sourceLocale: 'en',
        targetLocale: 'sv',
      }));
      const counts: number[] = [];
      await translator.batch?.(requests, {
        onChunk: (count) => counts.push(count),
      });
      expect(counts.length).toBe(4);
      expect(counts.reduce((sum, count) => sum + count, 0)).toBe(7);
    });

    it('throws when concurrency is not a positive integer', () => {
      expect(() =>
        anthropic({
          apiKey: 'k',
          concurrency: 0,
        }),
      ).toThrow(/concurrency must be a positive integer/);
    });

    it('throws when batch response length does not match', async () => {
      vi.stubGlobal(
        'fetch',
        async () =>
          new Response(
            JSON.stringify({
              content: [
                {
                  text: JSON.stringify([
                    {
                      sv: 'Hej',
                    },
                  ]),
                  type: 'text',
                },
              ],
            }),
            {
              status: 200,
            },
          ),
      );
      const translator = anthropic({
        apiKey: 'k',
      });
      await expect(
        translator.batch?.([
          {
            fileId: 'src/a.tsx',
            source: 'Hello',
            sourceLocale: 'en',
            targetLocale: 'sv',
          },
          {
            fileId: 'src/a.tsx',
            source: 'Save',
            sourceLocale: 'en',
            targetLocale: 'sv',
          },
        ]),
      ).rejects.toThrow(/expected 2/);
    });
  });

  describe('disambiguation', () => {
    it('writes `disambiguation` into the request items', async () => {
      const stub = stubFetch('Spara');
      await anthropic({
        apiKey: 'k',
      })({
        disambiguation: 'button',
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      });
      const body = stub.body() as {
        messages: Array<{
          content: string;
        }>;
      };
      // biome-ignore lint/style/noNonNullAssertion: yap yap yap
      const items = JSON.parse(body.messages[0]!.content) as Array<{
        disambiguation?: string;
      }>;
      expect(items[0]?.disambiguation).toBe('button');
    });

    it('writes `disambiguation` in the system prompt', async () => {
      const stub = stubFetch('Spara');
      await anthropic({
        apiKey: 'k',
      })({
        fileId: 'src/a.tsx',
        source: 'Save',
        sourceLocale: 'en',
        targetLocale: 'sv',
      });
      const body = stub.body() as {
        system: string;
      };
      expect(body.system).toContain('disambiguation');
    });
  });
});
