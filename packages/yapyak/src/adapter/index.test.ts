import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  ACCEPT_LANGUAGE: true,
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: { name: 'locale', type: 'cookie' },
  SYNC_HTML_LANG: false,
}));

const { i18n, resetI18n } = await import('../i18n/store');
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
    resetI18n();
  });

  it('returns the callback result', () => {
    const result = withRequest(makeRequest(), () => 42);
    expect(result).toBe(42);
  });

  it('binds locale inside the callback', () => {
    const result = withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
      i18n.locale,
    );
    expect(result).toBe('sv');
  });

  it('isolates locale across nested calls', () => {
    let outerSeenAfterInner = '';
    withRequest(makeRequest({ cookie: 'locale=sv' }), () => {
      withRequest(makeRequest({ cookie: 'locale=fr' }), () => {});
      outerSeenAfterInner = i18n.locale;
    });
    expect(outerSeenAfterInner).toBe('sv');
  });
});

describe('locale resolution inside withRequest', () => {
  afterEach(() => {
    resetI18n();
  });

  it('reads cookie locale from the request', () => {
    const result = withRequest(makeRequest({ cookie: 'locale=sv' }), () =>
      i18n.locale,
    );
    expect(result).toBe('sv');
  });

  it('falls back to Accept-Language when no cookie', () => {
    const result = withRequest(
      makeRequest({ acceptLanguage: 'sv-SE,en;q=0.9' }),
      () => i18n.locale,
    );
    expect(result).toBe('sv');
  });

  it('cookie takes priority over Accept-Language', () => {
    const result = withRequest(
      makeRequest({ acceptLanguage: 'fr', cookie: 'locale=sv' }),
      () => i18n.locale,
    );
    expect(result).toBe('sv');
  });

  it('returns default when no request scope', () => {
    expect(i18n.locale).toBe('en');
  });

  it('falls back when persisted cookie is unsupported locale', () => {
    const result = withRequest(
      makeRequest({ acceptLanguage: 'sv', cookie: 'locale=de' }),
      () => i18n.locale,
    );
    expect(result).toBe('sv');
  });
});
