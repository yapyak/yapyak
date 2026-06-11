import { describe, expect, it } from 'vitest';

import { url } from './url';

const LOCALES = [
  'en',
  'sv',
  'de',
  'sv-SE',
];

function getFromUrl(href: string, match?: RegExp): string | undefined {
  return url({
    locales: LOCALES,
    match,
  }).getFromRequest?.(new Request(href));
}

describe('url', () => {
  describe('with default path-first-segment matcher', () => {
    it('returns the locale from the first path segment', () => {
      expect(getFromUrl('https://app.test/sv/home')).toBe('sv');
    });

    it('returns the locale from a bare locale path without trailing slash', () => {
      expect(getFromUrl('https://app.test/sv')).toBe('sv');
    });

    it('returns the locale when the path has a trailing slash', () => {
      expect(getFromUrl('https://app.test/sv/')).toBe('sv');
    });

    it('returns the locale from the first segment of a deep path', () => {
      expect(getFromUrl('https://app.test/de/a/b/c')).toBe('de');
    });

    it('returns the locale ignoring the query string', () => {
      expect(getFromUrl('https://app.test/en/home?foo=bar')).toBe('en');
    });

    it('returns the locale for hyphenated locales', () => {
      expect(getFromUrl('https://app.test/sv-SE/home')).toBe('sv-SE');
    });

    it('returns `undefined` for the root path', () => {
      expect(getFromUrl('https://app.test/')).toBeUndefined();
    });

    it('returns `undefined` when the first segment is not a known locale', () => {
      expect(getFromUrl('https://app.test/about')).toBeUndefined();
    });

    it('returns `undefined` when locale case does not match', () => {
      expect(getFromUrl('https://app.test/SV/home')).toBeUndefined();
    });
  });

  describe('with query-string regex matcher', () => {
    const patternRx = /[?&]lang=(?<locale>[a-z]{2})/;

    it('returns the locale from the query param', () => {
      expect(getFromUrl('https://app.test/about?lang=sv', patternRx)).toBe(
        'sv',
      );
    });

    it('returns the locale when query has multiple params', () => {
      expect(
        getFromUrl('https://app.test/about?foo=bar&lang=de', patternRx),
      ).toBe('de');
    });

    it('returns `undefined` when the query is missing', () => {
      expect(getFromUrl('https://app.test/about', patternRx)).toBeUndefined();
    });

    it('returns `undefined` when captured value is not a known locale', () => {
      expect(
        getFromUrl('https://app.test/about?lang=fr', patternRx),
      ).toBeUndefined();
    });
  });

  describe('with capture-group regex matcher', () => {
    const patternRx = /^\/app\/([a-z]{2})/;

    it('returns the locale from group 1 when no named group', () => {
      expect(getFromUrl('https://app.test/app/sv/home', patternRx)).toBe('sv');
    });
  });

  describe('with a `/g`-flagged regex matcher', () => {
    it('returns the locale deterministically across consecutive navigations', () => {
      const patternRx = /\/(?<locale>en|sv)\//g;
      const persistence = url({
        locales: LOCALES,
        match: patternRx,
      });
      expect(
        persistence.getFromRequest?.(new Request('https://app.test/sv/home')),
      ).toBe('sv');
      expect(
        persistence.getFromRequest?.(new Request('https://app.test/en/about')),
      ).toBe('en');
      expect(
        persistence.getFromRequest?.(new Request('https://app.test/sv/list')),
      ).toBe('sv');
    });

    it('preserves the original regex `lastIndex` across calls', () => {
      const patternRx = /\/(?<locale>en|sv)\//g;
      url({
        locales: LOCALES,
        match: patternRx,
      }).getFromRequest?.(new Request('https://app.test/sv/home'));
      expect(patternRx.lastIndex).toBe(0);
    });
  });
});
