import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  LOCALES: ['en', 'sv', 'fr'],
  DEFAULT_LOCALE: 'en',
  PERSISTENCE: { type: 'cookie', name: 'locale' },
  ACCEPT_LANGUAGE: true,
  SYNC_HTML_LANG: false,
}));

const { getLocale, resetLocaleStore } = await import('../locale/store.js');
const { getRequestHeaders, withRequest } = await import('./index.js');

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

  it('makes headers readable inside the callback', () => {
    let captured: ReturnType<typeof getRequestHeaders>;
    withRequest(makeRequest({ cookie: 'locale=sv' }), () => {
      captured = getRequestHeaders();
    });
    expect(captured).toEqual({
      acceptLanguage: undefined,
      cookieHeader: 'locale=sv',
    });
  });

  it('returns the callback result', () => {
    const result = withRequest(makeRequest(), () => 42);
    expect(result).toBe(42);
  });

  it('isolates headers across nested calls', () => {
    let outerSeenAfterInner = '';
    withRequest(makeRequest({ cookie: 'locale=sv' }), () => {
      withRequest(makeRequest({ cookie: 'locale=fr' }), () => {
        // inner scope
      });
      outerSeenAfterInner = getRequestHeaders()?.cookieHeader ?? '';
    });
    expect(outerSeenAfterInner).toBe('locale=sv');
  });

  it('returns undefined outside any withRequest scope', () => {
    expect(getRequestHeaders()).toBeUndefined();
  });
});

describe('locale resolution inside withRequest', () => {
  afterEach(() => {
    resetLocaleStore();
  });

  it('reads cookie locale from the request', () => {
    const result = withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
      getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('falls back to Accept-Language when no cookie', () => {
    const result = withRequest(
      makeRequest({ acceptLanguage: 'sv-SE,en;q=0.9' }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('cookie takes priority over Accept-Language', () => {
    const result = withRequest(
      makeRequest({ acceptLanguage: 'fr', cookie: 'locale=sv' }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('returns default when no request scope', () => {
    expect(getLocale()).toBe('en');
  });

  it('falls back when persisted cookie is unsupported locale', () => {
    const result = withRequest(
      makeRequest({ acceptLanguage: 'sv', cookie: 'locale=de' }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });
});
