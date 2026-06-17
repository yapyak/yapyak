import { describe, expect, it } from 'vitest';

import { resolveLocale } from './resolve';

describe('resolveLocale', () => {
  it('returns the Accept-Language value when supported', () => {
    expect(
      resolveLocale(
        'en',
        [
          'en',
          'sv',
        ],
        {
          acceptLanguage: 'sv,en;q=0.9',
        },
      ),
    ).toBe('sv');
  });

  it('returns the language prefix match when the full locale is not supported', () => {
    expect(
      resolveLocale(
        'en',
        [
          'en',
          'sv',
        ],
        {
          acceptLanguage: 'sv-SE,en-GB;q=0.9',
        },
      ),
    ).toBe('sv');
  });

  it('returns the highest q-value locale when ranking candidates', () => {
    expect(
      resolveLocale(
        'en',
        [
          'en',
          'sv',
          'fr',
        ],
        {
          acceptLanguage: 'sv;q=0.5,fr;q=0.9,en;q=0.7',
        },
      ),
    ).toBe('fr');
  });

  it('returns the defaultLocale when nothing matches', () => {
    expect(
      resolveLocale(
        'en',
        [
          'en',
          'sv',
        ],
        {
          acceptLanguage: 'de,fr',
        },
      ),
    ).toBe('en');
  });

  it('returns the defaultLocale when no signals are provided', () => {
    expect(
      resolveLocale('en', [
        'en',
        'sv',
      ]),
    ).toBe('en');
  });

  it('walks the full BCP 47 fallback chain to find a supported script subtag', () => {
    expect(
      resolveLocale(
        'en',
        [
          'en',
          'zh-Hant',
        ],
        {
          acceptLanguage: 'zh-Hant-TW',
        },
      ),
    ).toBe('zh-Hant');
  });

  it('picks the language subtag when no script variant is supported', () => {
    expect(
      resolveLocale(
        'en',
        [
          'en',
          'zh',
        ],
        {
          acceptLanguage: 'zh-Hant-TW',
        },
      ),
    ).toBe('zh');
  });
});
