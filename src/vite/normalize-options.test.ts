import { describe, expect, it } from 'vitest';
import { normalizeOptions } from './normalize-options.js';

describe('normalizeOptions', () => {
  it('returns normalized options with sensible defaults', () => {
    const result = normalizeOptions({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    expect(result).toEqual({
      acceptLanguage: false,
      adapter: null,
      cookieName: 'locale',
      defaultLocale: 'en',
      framework: null,
      locales: ['en', 'sv'],
      localesDir: 'locales',
      persistence: null,
      storageKey: 'yapyak:locale',
      translator: undefined,
    });
  });

  it('passes through user-provided values', () => {
    const fakeTranslator = async (): Promise<string> => 'x';
    const result = normalizeOptions({
      acceptLanguage: true,
      adapter: 'tanstackStart',
      cookieName: 'app-locale',
      defaultLocale: 'sv',
      framework: 'react',
      locales: ['sv', 'en'],
      localesDir: 'translations',
      persistence: 'cookie',
      storageKey: 'app:locale',
      translator: fakeTranslator,
    });
    expect(result.framework).toBe('react');
    expect(result.adapter).toBe('tanstackStart');
    expect(result.persistence).toBe('cookie');
    expect(result.cookieName).toBe('app-locale');
    expect(result.localesDir).toBe('translations');
    expect(result.translator).toBe(fakeTranslator);
    expect(result.acceptLanguage).toBe(true);
  });

  it('throws when defaultLocale is missing', () => {
    expect(() =>
      normalizeOptions({
        defaultLocale: '',
        locales: ['en'],
      }),
    ).toThrow(/defaultLocale/);
  });

  it('throws when locales is empty', () => {
    expect(() =>
      normalizeOptions({
        defaultLocale: 'en',
        locales: [],
      }),
    ).toThrow(/locales/);
  });

  it('throws when defaultLocale is not in locales', () => {
    expect(() =>
      normalizeOptions({
        defaultLocale: 'de',
        locales: ['en', 'sv'],
      }),
    ).toThrow(/must be present/);
  });

  it('throws when a locale is empty', () => {
    expect(() =>
      normalizeOptions({
        defaultLocale: 'en',
        locales: ['en', ''],
      }),
    ).toThrow(/non-empty string/);
  });

  it('makes a defensive copy of locales array', () => {
    const locales = ['en', 'sv'];
    const result = normalizeOptions({
      defaultLocale: 'en',
      locales,
    });
    locales.push('mutated');
    expect(result.locales).toEqual(['en', 'sv']);
  });
});
