import { afterEach, describe, expect, it, vi } from 'vitest';
import { anthropic } from './anthropic.js';

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
        content: [{ text, type: 'text' }],
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
      key: 'greeting',
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
      key: 'g',
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
      key: 'g',
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
      key: 'g',
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
      key: 'g',
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
      key: 'cta',
      source: 'Sign up',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (stub.body() as { system: string }).system;
    expect(system).toContain('"Sign up" → "Skapa konto"');
    expect(system).not.toContain("S'inscrire");
  });

  it('includes file and key context in system prompt', async () => {
    const stub = stubFetch('Hej');
    await anthropic({ apiKey: 'k' })({
      fileId: 'src/components/welcome.tsx',
      key: 'greeting',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (stub.body() as { system: string }).system;
    expect(system).toContain('src/components/welcome.tsx');
    expect(system).toContain('greeting');
  });

  it('reminds the model to preserve placeholders', async () => {
    const stub = stubFetch('Hej {name}');
    await anthropic({ apiKey: 'k' })({
      fileId: 'x',
      key: 'g',
      source: 'Hi {name}',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    const system = (stub.body() as { system: string }).system;
    expect(system).toContain('{placeholder}');
  });

  it('throws when API responds with non-2xx', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response('rate limited', { status: 429 }),
    );
    const t = anthropic({ apiKey: 'k' });
    await expect(
      t({
        fileId: 'x',
        key: 'g',
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
        JSON.stringify({ content: [{ text: 'Hej', type: 'text' }] }),
        { status: 200 },
      );
    });
    await anthropic({
      apiKey: 'k',
      endpoint: 'https://proxy.example.com/messages',
    })({
      fileId: 'x',
      key: 'g',
      source: 'Hi',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(capturedUrl).toBe('https://proxy.example.com/messages');
  });
});
