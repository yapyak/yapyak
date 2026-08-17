import { describe, expect, it } from 'vitest';

import { resolvePluralCategories } from './plural-category';

describe('resolvePluralCategories', () => {
  it('returns the cardinal categories of the locale in CLDR order', () => {
    expect(resolvePluralCategories('pl', 'cardinal')).toEqual([
      'one',
      'few',
      'many',
      'other',
    ]);
  });

  it('returns the ordinal categories of the locale in CLDR order', () => {
    expect(resolvePluralCategories('en', 'ordinal')).toEqual([
      'one',
      'two',
      'few',
      'other',
    ]);
  });

  it('returns undefined when the runtime has no plural data for the locale', () => {
    expect(resolvePluralCategories('xx', 'cardinal')).toBeUndefined();
  });
});
