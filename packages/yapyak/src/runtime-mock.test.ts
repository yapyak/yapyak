import { describe, expect, it } from 'vitest';

import { buildRuntimeMock } from './runtime-mock';

describe('buildRuntimeMock', () => {
  describe('with defaults', () => {
    it('returns `en` as `DEFAULT_LOCALE`', () => {
      expect(buildRuntimeMock().DEFAULT_LOCALE).toBe('en');
    });

    it('returns `false` as `DETECT_USER_LOCALE`', () => {
      expect(buildRuntimeMock().DETECT_USER_LOCALE).toBe(false);
    });

    it('returns `[en, sv]` as `LOCALES`', () => {
      expect(buildRuntimeMock().LOCALES).toEqual([
        'en',
        'sv',
      ]);
    });

    it('returns `{ type: none }` as `PERSISTENCE_CONFIG`', () => {
      expect(buildRuntimeMock().PERSISTENCE_CONFIG).toEqual({
        type: 'none',
      });
    });

    it('returns `false` as `SYNC_HTML_LANG`', () => {
      expect(buildRuntimeMock().SYNC_HTML_LANG).toBe(false);
    });
  });

  describe('with overrides', () => {
    it('returns the configured `defaultLocale`', () => {
      expect(
        buildRuntimeMock({
          defaultLocale: 'sv',
        }).DEFAULT_LOCALE,
      ).toBe('sv');
    });

    it('returns the configured `detectUserLocale`', () => {
      expect(
        buildRuntimeMock({
          detectUserLocale: true,
        }).DETECT_USER_LOCALE,
      ).toBe(true);
    });

    it('returns the configured `locales`', () => {
      expect(
        buildRuntimeMock({
          locales: [
            'en',
            'sv',
            'fr',
          ],
        }).LOCALES,
      ).toEqual([
        'en',
        'sv',
        'fr',
      ]);
    });

    it('returns the configured `persistence`', () => {
      expect(
        buildRuntimeMock({
          persistence: {
            type: 'url',
          },
        }).PERSISTENCE_CONFIG,
      ).toEqual({
        type: 'url',
      });
    });

    it('returns the configured `syncHtmlLang`', () => {
      expect(
        buildRuntimeMock({
          syncHtmlLang: true,
        }).SYNC_HTML_LANG,
      ).toBe(true);
    });

    it('folds `defaultLocale` into `locales` when missing', () => {
      expect(
        buildRuntimeMock({
          defaultLocale: 'fr',
          locales: [
            'en',
            'sv',
          ],
        }).LOCALES,
      ).toEqual([
        'fr',
        'en',
        'sv',
      ]);
    });
  });
});
