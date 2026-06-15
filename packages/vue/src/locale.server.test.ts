// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defaultLocale, setLocale } from 'yapyak';

import { locale } from './locale';

describe('locale', () => {
  it('returns the default locale on `value` read without `window` (setLocale no-ops on server with `none` persistence)', () => {
    setLocale('sv');
    expect(locale.value).toBe(defaultLocale);
  });
});
