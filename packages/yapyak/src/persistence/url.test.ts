import { describe, expect, it } from 'vitest';

import { getLocaleFromUrl } from './url';

const LOCALES = ['en', 'sv', 'de', 'sv-SE'] as const;

describe('getLocaleFromUrl', () => {
  describe('with default path-first-segment matcher', () => {
    it('returns the locale from the first path segment', () => {
      expect(
        getLocaleFromUrl(new URL('https://app.test/sv/home'), LOCALES),
      ).toBe('sv');
    });

    it('returns the locale from a bare locale path without trailing slash', () => {
      expect(getLocaleFromUrl(new URL('https://app.test/sv'), LOCALES)).toBe(
        'sv',
      );
    });

    it('returns the locale when the path has a trailing slash', () => {
      expect(getLocaleFromUrl(new URL('https://app.test/sv/'), LOCALES)).toBe(
        'sv',
      );
    });

    it('returns the locale from the first segment of a deep path', () => {
      expect(
        getLocaleFromUrl(new URL('https://app.test/de/a/b/c'), LOCALES),
      ).toBe('de');
    });

    it('returns the locale ignoring the query string', () => {
      expect(
        getLocaleFromUrl(new URL('https://app.test/en/home?foo=bar'), LOCALES),
      ).toBe('en');
    });

    it('returns the locale for hyphenated locales', () => {
      expect(
        getLocaleFromUrl(new URL('https://app.test/sv-SE/home'), LOCALES),
      ).toBe('sv-SE');
    });

    it('returns `undefined` for the root path', () => {
      expect(getLocaleFromUrl(new URL('https://app.test/'), LOCALES)).toBe(
        undefined,
      );
    });

    it('returns `undefined` when the first segment is not a known locale', () => {
      expect(getLocaleFromUrl(new URL('https://app.test/about'), LOCALES)).toBe(
        undefined,
      );
    });

    it('returns `undefined` when locale case does not match', () => {
      expect(
        getLocaleFromUrl(new URL('https://app.test/SV/home'), LOCALES),
      ).toBe(undefined);
    });
  });

  describe('with query-string regex matcher', () => {
    const pattern = /[?&]lang=(?<locale>[a-z]{2})/;

    it('returns the locale from the query param', () => {
      expect(
        getLocaleFromUrl(
          new URL('https://app.test/about?lang=sv'),
          LOCALES,
          pattern,
        ),
      ).toBe('sv');
    });

    it('returns the locale when query has multiple params', () => {
      expect(
        getLocaleFromUrl(
          new URL('https://app.test/about?foo=bar&lang=de'),
          LOCALES,
          pattern,
        ),
      ).toBe('de');
    });

    it('returns `undefined` when the query is missing', () => {
      expect(
        getLocaleFromUrl(new URL('https://app.test/about'), LOCALES, pattern),
      ).toBe(undefined);
    });

    it('returns `undefined` when captured value is not a known locale', () => {
      expect(
        getLocaleFromUrl(
          new URL('https://app.test/about?lang=fr'),
          LOCALES,
          pattern,
        ),
      ).toBe(undefined);
    });
  });

  describe('with capture-group regex matcher', () => {
    const pattern = /^\/app\/([a-z]{2})/;

    it('returns the locale from group 1 when no named group', () => {
      expect(
        getLocaleFromUrl(
          new URL('https://app.test/app/sv/home'),
          LOCALES,
          pattern,
        ),
      ).toBe('sv');
    });
  });
});
