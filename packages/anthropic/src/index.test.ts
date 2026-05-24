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

  it('sends API key header', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'sk-test' })({
      fileId: 'src/x.tsx',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(stub.headers()['x-api-key']).toBe('sk-test');
  });

  it('uses default model when not specified', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'k' })({
      fileId: 'x',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect((stub.body() as { model: string }).model).toBe('claude-sonnet-4-6');
  });

  it('uses custom model when specified', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'k', model: 'claude-opus-4-7' })({
      fileId: 'x',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect((stub.body() as { model: string }).model).toBe('claude-opus-4-7');
  });

  it('includes voice in system prompt', async () => {
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

  it('includes matching glossary entries in system prompt', async () => {
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

  it('reminds the model to preserve placeholders', async () => {
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

  it('throws when API responds with non-2xx', async () => {
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

  it('uses custom endpoint when specified', async () => {
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

  it('uses .batch() to translate many strings in one call', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      calls++;
      const body = JSON.parse(init.body as string);
      const items: { source: string }[] = JSON.parse(body.messages[0].content);
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

  it('chunks .batch() into smaller calls when above batchSize', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      calls++;
      const body = JSON.parse(init.body as string);
      const items: { source: string }[] = JSON.parse(body.messages[0].content);
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

  it('strips markdown code fence around JSON', async () => {
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
