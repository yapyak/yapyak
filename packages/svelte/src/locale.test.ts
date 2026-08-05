import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, setLocale } from 'yapyak';

import { locale, registerLocale } from './locale.svelte';

afterEach(() => {
  setLocale('en');
});

describe('locale', () => {
  it('returns the current locale on `current` read', () => {
    setLocale('sv');
    expect(locale.current).toBe('sv');
  });

  it('writes the new locale on `current` write', () => {
    locale.current = 'sv';
    expect(getLocale()).toBe('sv');
  });
});

describe('registerLocale', () => {
  it('registers the locale subscription that updates `current`', () => {
    setLocale('sv');

    expect(locale.current).toBe('sv');
  });

  it('preserves `current` updates when called twice', () => {
    registerLocale();
    registerLocale();
    setLocale('sv');

    expect(locale.current).toBe('sv');
  });
});
