import { describe, expect, it } from 'vitest';

import { getTextDirection } from './text-direction';

describe('getTextDirection', () => {
  it('returns `ltr` for a Latin-script locale', () => {
    expect(getTextDirection('sv')).toBe('ltr');
  });

  it('returns `rtl` for an Arabic-script locale', () => {
    expect(getTextDirection('ar')).toBe('rtl');
  });

  it('returns `rtl` for a Hebrew-script locale', () => {
    expect(getTextDirection('he')).toBe('rtl');
  });

  it('returns `rtl` when a script subtag overrides an LTR language', () => {
    expect(getTextDirection('az-Arab')).toBe('rtl');
  });

  it('returns `ltr` when a script subtag overrides an RTL language', () => {
    expect(getTextDirection('ar-Latn')).toBe('ltr');
  });

  it('returns `rtl` for a locale whose likely script is RTL', () => {
    expect(getTextDirection('ks')).toBe('rtl');
  });

  it('throws when the locale is not a well-formed BCP 47 tag', () => {
    expect(() => getTextDirection('not a locale')).toThrow(RangeError);
  });
});
