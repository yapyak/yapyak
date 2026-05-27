import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cookie, parseCookie } from './cookie';

describe('cookie', () => {
  describe('in browser', () => {
    let cookieJar = '';

    beforeEach(() => {
      cookieJar = '';
      vi.stubGlobal('document', {
        get cookie() {
          return cookieJar;
        },
        set cookie(value: string) {
          const [pair] = value.split(';');
          if (!pair) return;
          const [name, val = ''] = pair.split('=');
          const trimmedName = name?.trim();
          if (!trimmedName) return;
          const existing = cookieJar
            .split(';')
            .map((p) => p.trim())
            .filter((p) => p && !p.startsWith(`${trimmedName}=`));
          existing.push(`${trimmedName}=${val.trim()}`);
          cookieJar = existing.join('; ');
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns the cookie value from `document.cookie`', () => {
      cookieJar = 'locale=sv';
      expect(cookie({ name: 'locale' }).get()).toBe('sv');
    });

    it('writes to `document.cookie` on set', () => {
      cookie({ name: 'locale' }).set('fr');
      expect(cookieJar).toContain('locale=fr');
    });

    it('writes under the configured cookie name', () => {
      cookie({ name: 'app-locale' }).set('de');
      expect(cookieJar).toContain('app-locale=de');
    });

    it('returns `false` from set', () => {
      expect(cookie({ name: 'locale' }).set('sv')).toBe(false);
    });

    it('returns the cookie value from the request `cookie` header', () => {
      const request = new Request('http://example.test', {
        headers: { cookie: 'locale=sv; theme=dark' },
      });
      expect(cookie({ name: 'locale' }).getFromRequest?.(request)).toBe('sv');
    });

    it('returns `undefined` when cookie is missing', () => {
      cookieJar = 'theme=dark';
      expect(cookie({ name: 'locale' }).get()).toBeUndefined();
    });

    it('returns `undefined` when cookie is an empty string', () => {
      cookieJar = 'locale=';
      expect(cookie({ name: 'locale' }).get()).toBeUndefined();
    });

    it('returns `undefined` from `getFromRequest` when `cookie` header is missing', () => {
      const request = new Request('http://example.test');
      expect(
        cookie({ name: 'locale' }).getFromRequest?.(request),
      ).toBeUndefined();
    });
  });

  describe('in non-browser environment', () => {
    it('returns `undefined` from `get` when `document` is missing', () => {
      expect(cookie({ name: 'locale' }).get()).toBeUndefined();
    });

    it('blocks `set` when `document` is missing', () => {
      expect(() => cookie({ name: 'locale' }).set('sv')).not.toThrow();
    });
  });
});

describe('parseCookie', () => {
  it('parses a single cookie', () => {
    expect(parseCookie('locale=sv')).toEqual({ locale: 'sv' });
  });

  it('parses multiple cookies', () => {
    expect(parseCookie('locale=sv; theme=dark')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('transforms whitespace around names and values', () => {
    expect(parseCookie('  locale  =  sv  ;  theme  =  dark  ')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('transforms URI-encoded values', () => {
    expect(parseCookie('greeting=Hej%20v%C3%A4rlden')).toEqual({
      greeting: 'Hej världen',
    });
  });

  it('clears surrounding double quotes from values', () => {
    expect(parseCookie('locale="sv"')).toEqual({ locale: 'sv' });
  });

  it('returns the raw value when decode fails', () => {
    expect(parseCookie('broken=%E0%A4%A')).toEqual({ broken: '%E0%A4%A' });
  });

  it('returns an empty object for an empty header', () => {
    expect(parseCookie('')).toEqual({});
  });

  it('blocks segments without an equals sign', () => {
    expect(parseCookie('locale=sv; broken; theme=dark')).toEqual({
      locale: 'sv',
      theme: 'dark',
    });
  });

  it('blocks segments with an empty name', () => {
    expect(parseCookie('=orphan; locale=sv')).toEqual({ locale: 'sv' });
  });

  it('preserves equals signs inside values', () => {
    expect(parseCookie('token=abc=def=ghi')).toEqual({
      token: 'abc=def=ghi',
    });
  });
});
