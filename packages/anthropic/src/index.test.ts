import { afterEach, describe, expect, it, vi } from 'vitest';

import { anthropic } from '.';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(text: string): {
  body: () => unknown;
  headers: () => Record<string, string>;
} {
  let captured: { body: unknown; headers: Record<string, string> } = {
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
        content: [{ text: JSON.stringify([text]), type: 'text' }],
      }),
      { status: 200 },
    );
  });
  return {
    body: () => captured.body,
    headers: () => captured.headers,
  };
}

describe('anthropic', () => {
  it('returns translated text trimmed', async () => {
    stubFetch('  Hej världen  ');
    const t = anthropic({ apiKey: 'k' });
    const result = await t({
      fileId: 'src/x.tsx',
      source: 'Hello world',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(result).toBe('Hej världen');
  });

  it('writes the API key as `x-api-key` header', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'sk-test' })({
      fileId: 'src/x.tsx',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.headers()['x-api-key']).toBe('sk-test');
  });

  it('builds requests with `claude-sonnet-4-6` as default model', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'k' })({
      fileId: 'x',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect((stub.body() as { model: string }).model).toBe('claude-sonnet-4-6');
  });

  it('builds requests with the configured model when set', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'k', model: 'claude-opus-4-7' })({
      fileId: 'x',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect((stub.body() as { model: string }).model).toBe('claude-opus-4-7');
  });

  it('builds system prompt with the configured voice', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'k', voice: 'Casual, never corporate' })({
      fileId: 'x',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect((stub.body() as { system: string }).system).toContain(
      'Casual, never corporate',
    );
  });

  it('builds system prompt with matching glossary entries', async () => {
    const stub = stubFetch('Skapa konto');
    await anthropic({
      apiKey: 'k',
      glossary: {
        'Sign up': { fr: "S'inscrire", sv: 'Skapa konto' },
      },
    })({
      fileId: 'x',
      source: 'Sign up',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (stub.body() as { system: string }).system;
    expect(system).toContain('"Sign up" → "Skapa konto"');
    expect(system).not.toContain("S'inscrire");
  });

  it('builds system prompt with placeholder preservation reminder', async () => {
    const stub = stubFetch('Hej {name}');
    await anthropic({ apiKey: 'k' })({
      fileId: 'x',
      source: 'Hi {name}',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (stub.body() as { system: string }).system;
    expect(system).toContain('{placeholder}');
  });

  it('builds requests against the configured endpoint when set', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', async (url: string) => {
      capturedUrl = url;
      return new Response(
        JSON.stringify({
          content: [{ text: JSON.stringify(['Hej']), type: 'text' }],
        }),
        { status: 200 },
      );
    });
    await anthropic({
      apiKey: 'k',
      endpoint: 'https://proxy.example.com/messages',
    })({
      fileId: 'x',
      source: 'Hi',
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
                text: '```json\n["Hej"]\n```',
                type: 'text',
              },
            ],
          }),
          { status: 200 },
        ),
    );
    const t = anthropic({ apiKey: 'k' });
    const result = await t({
      fileId: 'x',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(result).toBe('Hej');
  });

  it('throws when the API responds with non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('rate limited', { status: 429 }),
    );
    const t = anthropic({ apiKey: 'k' });
    await expect(
      t({
        fileId: 'x',
        source: 'Hi',
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
        const items: { source: string }[] = JSON.parse(
          body.messages[0].content,
        );
        const translations = items.map((item) =>
          item.source.replace(/Hello/g, 'Hej'),
        );
        return new Response(
          JSON.stringify({
            content: [{ text: JSON.stringify(translations), type: 'text' }],
          }),
          { status: 200 },
        );
      });
      const t = anthropic({ apiKey: 'k' });
      const results = await t.batch?.([
        {
          fileId: 'x',
          source: 'Hello A',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
        {
          fileId: 'x',
          source: 'Hello B',
          sourceLocale: 'en',
          targetLocale: 'sv',
        },
      ]);
      expect(results).toEqual(['Hej A', 'Hej B']);
      expect(calls).toBe(1);
    });

    it('transforms requests into smaller batches when above `batchSize`', async () => {
      let calls = 0;
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        calls++;
        const body = JSON.parse(init.body as string);
        const items: { source: string }[] = JSON.parse(
          body.messages[0].content,
        );
        return new Response(
          JSON.stringify({
            content: [
              { text: JSON.stringify(items.map(() => 'ok')), type: 'text' },
            ],
          }),
          { status: 200 },
        );
      });
      const t = anthropic({ apiKey: 'k', batchSize: 3 });
      const requests = Array.from({ length: 7 }, (_, i) => ({
        fileId: 'x',
        source: `s${i}`,
        sourceLocale: 'en',
        targetLocale: 'sv',
      }));
      const results = await t.batch?.(requests);
      expect(results?.length).toBe(7);
      expect(calls).toBe(3);
    });

    it('preserves order when later chunks resolve before earlier chunks', async () => {
      const callOrder: number[] = [];
      vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        const items: { source: string }[] = JSON.parse(
          body.messages[0].content,
        );
        const firstSource = items[0]?.source ?? '';
        const chunkIndex = Number(firstSource.replace('s', '')) / 2;
        callOrder.push(chunkIndex);
        const delay = chunkIndex === 0 ? 30 : 0;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return new Response(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify(items.map((item) => `t-${item.source}`)),
                type: 'text',
              },
            ],
          }),
          { status: 200 },
        );
      });
      const t = anthropic({ apiKey: 'k', batchSize: 2, concurrency: 3 });
      const requests = Array.from({ length: 6 }, (_, i) => ({
        fileId: 'x',
        source: `s${i}`,
        sourceLocale: 'en',
        targetLocale: 'sv',
      }));
      const results = await t.batch?.(requests);
      expect(results).toEqual(['t-s0', 't-s1', 't-s2', 't-s3', 't-s4', 't-s5']);
    });

    it('throws when concurrency is not a positive integer', () => {
      expect(() => anthropic({ apiKey: 'k', concurrency: 0 })).toThrow(
        /concurrency must be a positive integer/,
      );
    });

    it('throws when batch response length does not match', async () => {
      vi.stubGlobal(
        'fetch',
        async () =>
          new Response(
            JSON.stringify({
              content: [{ text: JSON.stringify(['only-one']), type: 'text' }],
            }),
            { status: 200 },
          ),
      );
      const t = anthropic({ apiKey: 'k' });
      await expect(
        t.batch?.([
          {
            fileId: 'x',
            source: 'A',
            sourceLocale: 'en',
            targetLocale: 'sv',
          },
          {
            fileId: 'x',
            source: 'B',
            sourceLocale: 'en',
            targetLocale: 'sv',
          },
        ]),
      ).rejects.toThrow(/expected 2/);
    });
  });
});
