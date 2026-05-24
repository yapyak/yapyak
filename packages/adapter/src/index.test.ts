import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: true,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { name: 'locale', type: 'cookie' },
  SYNC_HTML_LANG: false,
}));

const { getLocale, resetLocale } = await import('@yapyak/core');
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
    resetLocale();
  });

  it('returns the callback result', () => {
    const result = withRequest(makeRequest(), () => 42);
    expect(result).toBe(42);
  });

  it('binds locale inside the callback', () => {
    const result = withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
      getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('isolates locale across nested calls', () => {
    let outerSeenAfterInner = '';
    withRequest(makeRequest({ cookie: 'locale=sv' }), () => {
      withRequest(makeRequest({ cookie: 'locale=fr' }), () => {});
      outerSeenAfterInner = getLocale();
    });
    expect(outerSeenAfterInner).toBe('sv');
  });
});

describe('locale resolution inside withRequest', () => {
  afterEach(() => {
    resetLocale();
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
