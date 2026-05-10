import { describe, expect, it } from 'vitest';
import { normalizeOptions } from './normalize-options.js';

describe('normalizeOptions', () => {
  it('returns normalized options with sensible defaults', () => {
    const result = normalizeOptions({});
    expect(result).toEqual({
      acceptLanguage: false,
      cookieName: 'locale',
      defaultLocale: undefined,
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
      cookieName: 'app-locale',
      defaultLocale: 'sv',
      localesDir: 'translations',
      persistence: 'cookie',
      storageKey: 'app:locale',
      translator: fakeTranslator,
    });
    expect(result.persistence).toBe('cookie');
    expect(result.cookieName).toBe('app-locale');
    expect(result.localesDir).toBe('translations');
    expect(result.translator).toBe(fakeTranslator);
    expect(result.acceptLanguage).toBe(true);
    expect(result.defaultLocale).toBe('sv');
  });
});
