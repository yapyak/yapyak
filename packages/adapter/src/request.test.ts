import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@yapyak/shared', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: true,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { name: 'locale', type: 'cookie' },
  SYNC_HTML_LANG: false,
}));

const { getLocale, setLocale } = await import('yapyak');
const { resetLocale } = await import('yapyak/internal');
const { getPendingResponseHeaders, withRequest } = await import('./index');

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

  it('preserves outer locale when nested call sets a different locale', () => {
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

    it('returns `Accept-Language` locale when no cookie is present', () => {
      const result = withRequest(
        makeRequest({ acceptLanguage: 'sv-SE,en;q=0.9' }),
        () => getLocale(),
      );
      expect(result).toBe('sv');
    });

    it('returns cookie locale when `Accept-Language` is also present', () => {
      const result = withRequest(
        makeRequest({ acceptLanguage: 'fr', cookie: 'locale=sv' }),
        () => getLocale(),
      );
      expect(result).toBe('sv');
    });

    it('returns default locale when no request scope', () => {
      expect(getLocale()).toBe('en');
    });

    it('returns `Accept-Language` locale when persisted cookie is unsupported', () => {
      const result = withRequest(
        makeRequest({ acceptLanguage: 'sv', cookie: 'locale=de' }),
        () => getLocale(),
      );
      expect(result).toBe('sv');
    });
  });

  describe('pending response headers', () => {
    it('returns an empty `Headers` instance when called outside a scope', () => {
      const headers = getPendingResponseHeaders();
      expect(Array.from(headers)).toEqual([]);
    });

    it('buffers `Set-Cookie` from `setLocale` inside the scope', () => {
      const collected = withRequest(makeRequest(), () => {
        setLocale('sv');
        return Array.from(getPendingResponseHeaders());
      });
      expect(collected).toEqual([
        ['set-cookie', 'locale=sv; path=/; max-age=31536000; samesite=lax'],
      ]);
    });

    it('isolates pending headers between concurrent scopes', () => {
      let outer: Array<[string, string]> = [];
      let inner: Array<[string, string]> = [];
      withRequest(makeRequest(), () => {
        setLocale('sv');
        withRequest(makeRequest(), () => {
          setLocale('fr');
          inner = Array.from(getPendingResponseHeaders());
        });
        outer = Array.from(getPendingResponseHeaders());
      });
      expect(inner).toEqual([
        ['set-cookie', 'locale=fr; path=/; max-age=31536000; samesite=lax'],
      ]);
      expect(outer).toEqual([
        ['set-cookie', 'locale=sv; path=/; max-age=31536000; samesite=lax'],
      ]);
    });
  });
});
