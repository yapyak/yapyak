import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: true,
  LOCALES: [
    'en',
    'sv',
    'fr',
  ],
  PERSISTENCE_CONFIG: {
    name: 'locale',
    type: 'cookie',
  },
  SYNC_HTML_LANG: false,
}));

import { getLocale } from '../index';
import { resetLocale } from '../internal';
import { withRequest } from './request';

function makeRequest(
  headers: { acceptLanguage?: string; cookie?: string } = {},
): Request {
  const newHeaders = new Headers();
  if (headers.acceptLanguage !== undefined) {
    newHeaders.set('accept-language', headers.acceptLanguage);
  }
  if (headers.cookie !== undefined) {
    newHeaders.set('cookie', headers.cookie);
  }
  return new Request('http://example.test', {
    headers: newHeaders,
  });
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
    const result = withRequest(
      makeRequest({
        cookie: 'locale=sv',
      }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('preserves outer locale when nested call sets a different locale', () => {
    let outerSeenAfterInner = '';
    withRequest(
      makeRequest({
        cookie: 'locale=sv',
      }),
      () => {
        withRequest(
          makeRequest({
            cookie: 'locale=fr',
          }),
          () => {},
        );
        outerSeenAfterInner = getLocale();
      },
    );
    expect(outerSeenAfterInner).toBe('sv');
  });

  it('returns cookie locale from the request', () => {
    const result = withRequest(
      makeRequest({
        cookie: 'locale=sv',
      }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('returns `Accept-Language` locale when no cookie is present', () => {
    const result = withRequest(
      makeRequest({
        acceptLanguage: 'sv-SE,en;q=0.9',
      }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('returns cookie locale when `Accept-Language` is also present', () => {
    const result = withRequest(
      makeRequest({
        acceptLanguage: 'fr',
        cookie: 'locale=sv',
      }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });

  it('returns default locale when no request scope', () => {
    expect(getLocale()).toBe('en');
  });

  it('returns `Accept-Language` locale when persisted cookie is unsupported', () => {
    const result = withRequest(
      makeRequest({
        acceptLanguage: 'sv',
        cookie: 'locale=de',
      }),
      () => getLocale(),
    );
    expect(result).toBe('sv');
  });
});
