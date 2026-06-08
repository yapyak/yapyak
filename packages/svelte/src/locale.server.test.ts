// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { locale } from './locale.svelte';

afterEach(() => {
  setLocale('en');
});

describe('locale', () => {
  it('returns the current locale on `current` read without `window`', () => {
    setLocale('sv');
    expect(locale.current).toBe('sv');
  });
});
