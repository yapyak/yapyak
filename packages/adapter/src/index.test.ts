import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: true,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { name: 'locale', type: 'cookie' },
  SYNC_HTML_LANG: false,
}));

const { getLocale } = await import('yapyak');
const { resetLocale } = await import('yapyak/internal');
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

  describe('locale resolution', () => {
    it('returns cookie locale from the request', () => {
      const result = withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
        getLocale(),
      );
      expect(result).toBe('sv');
    });

    it('returns Accept-Language locale when no cookie', () => {
      const result = withRequest(
        makeRequest({ acceptLanguage: 'sv-SE,en;q=0.9' }),
        () => getLocale(),
      );
      expect(result).toBe('sv');
    });

    it('returns cookie locale when both cookie and Accept-Language are present', () => {
      const result = withRequest(
        makeRequest({ acceptLanguage: 'fr', cookie: 'locale=sv' }),
        () => getLocale(),
      );
      expect(result).toBe('sv');
    });

    it('returns default locale when no request scope', () => {
      expect(getLocale()).toBe('en');
    });

    it('returns Accept-Language locale when persisted cookie is unsupported', () => {
      const result = withRequest(
        makeRequest({ acceptLanguage: 'sv', cookie: 'locale=de' }),
        () => getLocale(),
      );
      expect(result).toBe('sv');
    });
  });
});
