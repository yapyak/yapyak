import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../index';
import { resetLocale } from '../internal';
import {
  getPendingResponseHeaders,
  mergePendingResponseHeaders,
} from './pending-response-header';
import { withRequest } from './request';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
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

function makeRequest(): Request {
  return new Request('http://example.test');
}

describe('getPendingResponseHeaders', () => {
  afterEach(() => {
    resetLocale();
  });

  it('returns an empty `Headers` instance when called outside a scope', () => {
    const headers = getPendingResponseHeaders();
    expect(Array.from(headers)).toEqual([]);
  });

  it('holds `Set-Cookie` from `setLocale` inside the scope', () => {
    const collected = withRequest(makeRequest(), () => {
      setLocale('sv');
      return Array.from(getPendingResponseHeaders());
    });
    expect(collected).toEqual([
      [
        'set-cookie',
        'locale=sv; path=/; max-age=31536000; samesite=lax',
      ],
    ]);
  });

  it('preserves pending headers between concurrent scopes', () => {
    let outer: [
      string,
      string,
    ][] = [];
    let inner: [
      string,
      string,
    ][] = [];
    withRequest(makeRequest(), () => {
      setLocale('sv');
      withRequest(makeRequest(), () => {
        setLocale('fr');
        inner = Array.from(getPendingResponseHeaders());
      });
      outer = Array.from(getPendingResponseHeaders());
    });
    expect(inner).toEqual([
      [
        'set-cookie',
        'locale=fr; path=/; max-age=31536000; samesite=lax',
      ],
    ]);
    expect(outer).toEqual([
      [
        'set-cookie',
        'locale=sv; path=/; max-age=31536000; samesite=lax',
      ],
    ]);
  });
});

describe('mergePendingResponseHeaders', () => {
  afterEach(() => {
    resetLocale();
  });

  it('writes no entry when called outside a scope', () => {
    const target = new Headers();
    mergePendingResponseHeaders(target);
    expect(Array.from(target)).toEqual([]);
  });

  it('writes every pending entry into the target inside a scope', () => {
    const target = new Headers();
    withRequest(makeRequest(), () => {
      setLocale('sv');
      mergePendingResponseHeaders(target);
    });
    expect(Array.from(target)).toEqual([
      [
        'set-cookie',
        'locale=sv; path=/; max-age=31536000; samesite=lax',
      ],
    ]);
  });

  it('preserves existing target entries when merging', () => {
    const target = new Headers({
      'x-custom': 'kept',
    });
    withRequest(makeRequest(), () => {
      setLocale('sv');
      mergePendingResponseHeaders(target);
    });
    expect(target.get('x-custom')).toBe('kept');
    expect(target.get('set-cookie')).toContain('locale=sv');
  });
});
