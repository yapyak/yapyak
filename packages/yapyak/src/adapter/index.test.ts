import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  ACCEPT_LANGUAGE: true,
  DEFAULT_LOCALE: 'en',
  LOADERS: {},
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { name: 'locale', type: 'cookie' },
  SYNC_HTML_LANG: false,
}));

const { getLocale, resetLocaleStore } = await import('../locale/store');
const { withRequest } = await import('./index');

function makeRequest(
  headers: { acceptLanguage?: string; cookie?: string } = {},
): Request {
  const h = new Headers();
  if (headers.acceptLanguage !== undefined) {
    h.set('accept-language', headers.acceptLanguage);
  }
  if (headers.cookie !== undefined) {
    h.set('cookie', headers.cookie);
  }
  return new Request('http://example.test', { headers: h });
}

describe('withRequest', () => {
  afterEach(() => {
    resetLocaleStore();
  });

  it('returns the callback result', async () => {
    const result = await withRequest(makeRequest(), () => 42);
    expect(result).toBe(42);
  });

  it('binds locale inside the callback', async () => {
    const result = await withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
      getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('isolates locale across nested calls', async () => {
    let outerSeenAfterInner = '';
    await withRequest(makeRequest({ cookie: 'locale=sv' }), async () => {
      await withRequest(makeRequest({ cookie: 'locale=fr' }), () => {});
      outerSeenAfterInner = getLocale();
    });
    expect(outerSeenAfterInner).toBe('sv');
  });
});

describe('locale resolution inside withRequest', () => {
  afterEach(() => {
    resetLocaleStore();
  });

  it('reads cookie locale from the request', async () => {
    const result = await withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
      getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('falls back to Accept-Language when no cookie', async () => {
    const result = await withRequest(
      makeRequest({ acceptLanguage: 'sv-SE,en;q=0.9' }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('cookie takes priority over Accept-Language', async () => {
    const result = await withRequest(
      makeRequest({ acceptLanguage: 'fr', cookie: 'locale=sv' }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('returns default when no request scope', () => {
    expect(getLocale()).toBe('en');
  });

  it('falls back when persisted cookie is unsupported locale', async () => {
    const result = await withRequest(
      makeRequest({ acceptLanguage: 'sv', cookie: 'locale=de' }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });
});
