import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, setLocale } from 'yapyak';

import { locale } from './locale.svelte';

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
