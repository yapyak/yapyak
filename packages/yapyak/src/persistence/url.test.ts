import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
import { url } from './url';

function getFromUrl(href: string, match?: RegExp): string | undefined {
  return url({
    match,
  }).getFromRequest?.(new Request(href));
}

describe('url', () => {
  describe('with default path-first-segment matcher', () => {
    it('returns the first path segment', () => {
      expect(getFromUrl('https://app.test/sv/home')).toBe('sv');
    });

    it('returns the segment from a bare path without trailing slash', () => {
      expect(getFromUrl('https://app.test/sv')).toBe('sv');
    });

    it('returns the segment when the path has a trailing slash', () => {
      expect(getFromUrl('https://app.test/sv/')).toBe('sv');
    });

    it('returns the first segment of a deep path', () => {
      expect(getFromUrl('https://app.test/de/a/b/c')).toBe('de');
    });

    it('returns the segment ignoring the query string', () => {
      expect(getFromUrl('https://app.test/en/home?foo=bar')).toBe('en');
    });

    it('returns the full segment for a hyphenated tag', () => {
      expect(getFromUrl('https://app.test/sv-SE/home')).toBe('sv-SE');
    });

    it('returns `undefined` for the root path', () => {
      expect(getFromUrl('https://app.test/')).toBeUndefined();
    });

    it('preserves the segment casing', () => {
      expect(getFromUrl('https://app.test/SV/home')).toBe('SV');
    });
  });

  describe('with query-string regex matcher', () => {
    const patternRx = /[?&]lang=(?<locale>[a-z]{2})/;

    it('returns the captured group from the query param', () => {
      expect(getFromUrl('https://app.test/about?lang=sv', patternRx)).toBe(
        'sv',
      );
    });

    it('returns the captured group when query has multiple params', () => {
      expect(
        getFromUrl('https://app.test/about?foo=bar&lang=de', patternRx),
      ).toBe('de');
    });

    it('returns `undefined` when the query is missing', () => {
      expect(getFromUrl('https://app.test/about', patternRx)).toBeUndefined();
    });
  });

  describe('with capture-group regex matcher', () => {
    const patternRx = /^\/app\/([a-z]{2})/;

    it('falls back to group 1 when no named group exists', () => {
      expect(getFromUrl('https://app.test/app/sv/home', patternRx)).toBe('sv');
    });
  });

  describe('with a `/g`-flagged regex matcher', () => {
    it('returns the captured group deterministically across consecutive navigations', () => {
      const patternRx = /\/(?<locale>en|sv)\//g;
      const persistence = url({
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
        match: patternRx,
      }).getFromRequest?.(new Request('https://app.test/sv/home'));
      expect(patternRx.lastIndex).toBe(0);
    });
  });

  describe('in non-browser environment', () => {
    it('returns `undefined` from `get` when `window` is missing', () => {
      expect(url({}).get()).toBeUndefined();
    });

    it('returns a no-op unsubscribe from `subscribe` when `window` is missing', () => {
      const unsubscribe = url({}).subscribe?.(vi.fn());
      expect(unsubscribe).toBeTypeOf('function');
      expect(() => unsubscribe?.()).not.toThrow();
    });
  });

  describe('in browser', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns the first path segment from `window.location`', () => {
      vi.stubGlobal('window', {
        location: new URL('https://app.test/sv/home'),
      });
      expect(url({}).get()).toBe('sv');
    });
  });

  describe('set', () => {
    afterEach(() => {
      resetWarn();
    });

    it('returns `false` and warns with `YAP0026`', () => {
      const warnSpy =
        vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
      setWarn(warnSpy);
      const result = url({}).set('sv');
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('setLocale() skipped'),
        expect.objectContaining({
          code: 'YAP0026',
        }),
      );
    });
  });
});
