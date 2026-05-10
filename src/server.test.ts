import { describe, expect, it } from 'vitest';
import {
  getRequestContext,
  resolveRequestLocale,
  withRequest,
} from './server.js';

describe('withRequest', () => {
  it('makes context readable inside the callback', () => {
    let captured: ReturnType<typeof getRequestContext>;
    withRequest({ cookieHeader: 'locale=sv' }, () => {
      captured = getRequestContext();
    });
    expect(captured).toEqual({ cookieHeader: 'locale=sv' });
  });

  it('returns the callback result', () => {
    const result = withRequest({}, () => 42);
    expect(result).toBe(42);
  });

  it('isolates contexts across nested calls', () => {
    const outerHeader = 'locale=sv';
    const innerHeader = 'locale=fr';
    let outerSeenAfterInner = '';
    withRequest({ cookieHeader: outerHeader }, () => {
      withRequest({ cookieHeader: innerHeader }, () => {
        // inner scope
      });
      outerSeenAfterInner = getRequestContext()?.cookieHeader ?? '';
    });
    expect(outerSeenAfterInner).toBe(outerHeader);
  });

  it('returns undefined outside any withRequest scope', () => {
    expect(getRequestContext()).toBeUndefined();
  });
});

describe('resolveRequestLocale', () => {
  it('reads cookie locale from request context', () => {
    const result = withRequest({ cookieHeader: 'locale=sv' }, () =>
      resolveRequestLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    );
    expect(result).toBe('sv');
  });

  it('falls back to Accept-Language when no cookie', () => {
    const result = withRequest(
      { acceptLanguage: 'sv-SE,en;q=0.9' },
      () =>
        resolveRequestLocale({
          defaultLocale: 'en',
          locales: ['en', 'sv'],
        }),
    );
    expect(result).toBe('sv');
  });

  it('cookie takes priority over Accept-Language', () => {
    const result = withRequest(
      { acceptLanguage: 'fr', cookieHeader: 'locale=sv' },
      () =>
        resolveRequestLocale({
          defaultLocale: 'en',
          locales: ['en', 'sv', 'fr'],
        }),
    );
    expect(result).toBe('sv');
  });

  it('returns default when no request context', () => {
    expect(
      resolveRequestLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('en');
  });

  it('uses configured cookie name', () => {
    const result = withRequest({ cookieHeader: 'app-locale=fr' }, () =>
      resolveRequestLocale({
        cookieName: 'app-locale',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'fr'],
      }),
    );
    expect(result).toBe('fr');
  });

  it('falls back when persisted cookie is unsupported locale', () => {
    const result = withRequest(
      { acceptLanguage: 'sv', cookieHeader: 'locale=de' },
      () =>
        resolveRequestLocale({
          defaultLocale: 'en',
          locales: ['en', 'sv'],
        }),
    );
    expect(result).toBe('sv');
  });
});
