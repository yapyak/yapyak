// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defaultLocale, setLocale } from 'yapyak';

import { locale } from './locale.svelte';

describe('locale', () => {
  it('returns the default locale on `current` read without `window` (setLocale no-ops on server with `none` persistence)', () => {
    setLocale('sv');
    expect(locale.current).toBe(defaultLocale);
  });
});
