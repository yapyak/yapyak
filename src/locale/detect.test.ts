import { describe, expect, it } from 'vitest';

import { detectLocale, parseAcceptLanguage } from './detect.js';

describe('detectLocale', () => {
  it('uses persisted value when supported', () => {
    expect(
      detectLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        persisted: 'sv',
      }),
    ).toBe('sv');
  });

  it('ignores persisted value when unsupported', () => {
    expect(
      detectLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        persisted: 'de',
      }),
    ).toBe('en');
  });

  it('reads Accept-Language when no persisted value', () => {
    expect(
      detectLocale({
        acceptLanguage: 'sv,en;q=0.9',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('sv');
  });

  it('matches lang prefix when full locale not supported', () => {
    expect(
      detectLocale({
        acceptLanguage: 'sv-SE,en-GB;q=0.9',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('sv');
  });

  it('respects q-values when ranking candidates', () => {
    expect(
      detectLocale({
        acceptLanguage: 'sv;q=0.5,fr;q=0.9,en;q=0.7',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'fr'],
      }),
    ).toBe('fr');
  });

  it('reads navigator.languages when Accept-Language missing', () => {
    expect(
      detectLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        navigatorLanguages: ['sv-SE', 'en'],
      }),
    ).toBe('sv');
  });

  it('falls back to defaultLocale when nothing matches', () => {
    expect(
      detectLocale({
        acceptLanguage: 'de,fr',
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('en');
  });

  it('persisted takes priority over Accept-Language', () => {
    expect(
      detectLocale({
        acceptLanguage: 'fr',
        defaultLocale: 'en',
        locales: ['en', 'sv', 'fr'],
        persisted: 'sv',
      }),
    ).toBe('sv');
  });

  it('returns defaultLocale when no signals provided', () => {
    expect(
      detectLocale({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
      }),
    ).toBe('en');
  });
});

describe('parseAcceptLanguage', () => {
  it('returns empty array for empty header', () => {
    expect(parseAcceptLanguage('')).toEqual([]);
  });

  it('parses single locale', () => {
    expect(parseAcceptLanguage('sv')).toEqual(['sv']);
  });

  it('parses multiple locales preserving order when no quality given', () => {
    expect(parseAcceptLanguage('sv,fr,en')).toEqual(['sv', 'fr', 'en']);
  });

  it('sorts by q-value descending', () => {
    expect(parseAcceptLanguage('sv;q=0.5,fr;q=0.9,en;q=0.7')).toEqual([
      'fr',
      'en',
      'sv',
    ]);
  });

  it('treats missing q as 1.0', () => {
    expect(parseAcceptLanguage('en;q=0.5,sv')).toEqual(['sv', 'en']);
  });

  it('skips wildcard *', () => {
    expect(parseAcceptLanguage('sv,*;q=0.1')).toEqual(['sv']);
  });

  it('skips entries with q=0', () => {
    expect(parseAcceptLanguage('sv;q=0,fr')).toEqual(['fr']);
  });
});
