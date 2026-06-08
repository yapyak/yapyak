import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, setLocale } from 'yapyak';

import { locale } from './locale';

afterEach(() => {
  setLocale('en');
});

describe('locale', () => {
  it('returns the current locale on `value` read', () => {
    setLocale('sv');
    expect(locale.value).toBe('sv');
  });

  it('writes the new locale on `value` write', () => {
    locale.value = 'sv';
    expect(getLocale()).toBe('sv');
  });
});
