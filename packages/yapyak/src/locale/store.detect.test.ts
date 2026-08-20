import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getLocale, resetLocale } from './store';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_USER_LOCALE: true,
  LOCALES: [
    'en',
    'sv',
    'fr',
  ],
  PERSISTENCE_CONFIG: {
    type: 'none',
  },
  SYNC_HTML_ATTRIBUTES: false,
}));

beforeEach(() => {
  vi.stubGlobal('window', {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetLocale();
});

describe('getLocale', () => {
  describe('with `detectUserLocale` on the client', () => {
    it('returns the first matching locale from `navigator.languages`', () => {
      vi.stubGlobal('navigator', {
        languages: [
          'sv-SE',
          'sv',
          'en',
        ],
      });
      resetLocale();
      expect(getLocale()).toBe('sv');
    });

    it('returns the default locale when `navigator.languages` has no match', () => {
      vi.stubGlobal('navigator', {
        languages: [
          'ja',
          'ko',
        ],
      });
      resetLocale();
      expect(getLocale()).toBe('en');
    });

    it('returns the default locale when `navigator` is undefined', () => {
      vi.stubGlobal('navigator', undefined);
      resetLocale();
      expect(getLocale()).toBe('en');
    });
  });
});
