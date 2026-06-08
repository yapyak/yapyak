// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { locale } from './locale';

afterEach(() => {
  setLocale('en');
});

describe('locale', () => {
  it('returns the current locale on `value` read without `window`', () => {
    setLocale('sv');
    expect(locale.value).toBe('sv');
  });
});
