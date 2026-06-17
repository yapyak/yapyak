import { describe, expect, it } from 'vitest';

import { parseAcceptLanguage } from './accept-language';

describe('parseAcceptLanguage', () => {
  it('parses a single locale', () => {
    expect(parseAcceptLanguage('sv')).toEqual([
      'sv',
    ]);
  });

  it('parses multiple locales preserving order when no quality given', () => {
    expect(parseAcceptLanguage('sv,fr,en')).toEqual([
      'sv',
      'fr',
      'en',
    ]);
  });

  it('returns locales in `q`-value descending order', () => {
    expect(parseAcceptLanguage('sv;q=0.5,fr;q=0.9,en;q=0.7')).toEqual([
      'fr',
      'en',
      'sv',
    ]);
  });

  it('parses missing q as 1.0', () => {
    expect(parseAcceptLanguage('en;q=0.5,sv')).toEqual([
      'sv',
      'en',
    ]);
  });

  it('returns an empty array for an empty header', () => {
    expect(parseAcceptLanguage('')).toEqual([]);
  });

  it('blocks wildcard `*`', () => {
    expect(parseAcceptLanguage('sv,*;q=0.1')).toEqual([
      'sv',
    ]);
  });

  it('blocks entries with q=0', () => {
    expect(parseAcceptLanguage('sv;q=0,fr')).toEqual([
      'fr',
    ]);
  });

  it('drops the segment when q is non-numeric', () => {
    expect(parseAcceptLanguage('sv;q=abc,fr')).toEqual([
      'fr',
    ]);
  });

  it('drops the segment when q is above 1', () => {
    expect(parseAcceptLanguage('sv;q=5,fr;q=0.5')).toEqual([
      'fr',
    ]);
  });

  it('drops the segment when q is negative', () => {
    expect(parseAcceptLanguage('sv;q=-1,fr')).toEqual([
      'fr',
    ]);
  });

  it('blocks whitespace-only segments', () => {
    expect(parseAcceptLanguage(' , ,sv')).toEqual([
      'sv',
    ]);
  });

  it('treats `Q=` as equivalent to `q=` per RFC 7231 §5.3.1', () => {
    expect(parseAcceptLanguage('sv;Q=0.5,fr;Q=0.9,en;Q=0.7')).toEqual([
      'fr',
      'en',
      'sv',
    ]);
  });
});
