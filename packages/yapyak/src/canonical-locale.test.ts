import { describe, expect, it } from 'vitest';

import { findCanonicalLocale } from './canonical-locale';

describe('findCanonicalLocale', () => {
  it('returns the configured locale when the candidate matches exactly', () => {
    expect(
      findCanonicalLocale('sv', [
        'en',
        'sv',
      ]),
    ).toBe('sv');
  });

  it('returns the configured locale when the candidate differs only by casing', () => {
    expect(
      findCanonicalLocale('SV', [
        'en',
        'sv',
      ]),
    ).toBe('sv');
  });

  it('returns the configured locale for a script subtag with mixed casing', () => {
    expect(
      findCanonicalLocale('zh-HANT', [
        'en',
        'zh-Hant',
      ]),
    ).toBe('zh-Hant');
  });

  it('returns undefined when no locale matches', () => {
    expect(
      findCanonicalLocale('de', [
        'en',
        'sv',
      ]),
    ).toBeUndefined();
  });

  it('returns undefined when the candidate is malformed and no locale matches', () => {
    expect(
      findCanonicalLocale('not a locale', [
        'en',
        'sv',
      ]),
    ).toBeUndefined();
  });
});
