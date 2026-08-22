import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { textDirection } from './text-direction';

afterEach(() => {
  setLocale('en');
});

describe('textDirection', () => {
  it('returns the text direction on `current` read', () => {
    setLocale('sv');
    expect(textDirection.current).toBe('ltr');
  });

  it('returns `rtl` on `current` read when the locale changes to an RTL locale', () => {
    setLocale('ar');
    expect(textDirection.current).toBe('rtl');
  });
});
