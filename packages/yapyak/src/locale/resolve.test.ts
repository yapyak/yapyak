import { describe, expect, it } from 'vitest';

import { resolveLocale } from './resolve';

describe('resolveLocale', () => {
  it('returns persisted value when supported', () => {
    expect(
      resolveLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        persisted: 'sv',
      }),
    ).toBe('sv');
  });

  it('returns Accept-Language value when no persisted value', () => {
    expect(
      resolveLocale({
        acceptLanguage: 'sv,en;q=0.9',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('sv');
  });

  it('returns lang prefix match when full locale not supported', () => {
    expect(
      resolveLocale({
        acceptLanguage: 'sv-SE,en-GB;q=0.9',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('sv');
  });

  it('returns highest q-value locale when ranking candidates', () => {
    expect(
      resolveLocale({
        acceptLanguage: 'sv;q=0.5,fr;q=0.9,en;q=0.7',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'fr'],
      }),
    ).toBe('fr');
  });

  it('returns navigator.languages value when Accept-Language missing', () => {
    expect(
      resolveLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        navigatorLanguages: ['sv-SE', 'en'],
      }),
    ).toBe('sv');
  });

  it('returns persisted value when both persisted and Accept-Language are present', () => {
    expect(
      resolveLocale({
        acceptLanguage: 'fr',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'fr'],
        persisted: 'sv',
      }),
    ).toBe('sv');
  });

  it('returns defaultLocale when persisted value unsupported', () => {
    expect(
      resolveLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        persisted: 'de',
      }),
    ).toBe('en');
  });

  it('returns defaultLocale when nothing matches', () => {
    expect(
      resolveLocale({
        acceptLanguage: 'de,fr',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('en');
  });

  it('returns defaultLocale when no signals provided', () => {
    expect(
      resolveLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('en');
  });
});
