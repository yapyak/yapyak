// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { setLocale } from 'yapyak';

import { textDirection } from './text-direction';

describe('textDirection', () => {
  it('returns the default text direction on `current` read without `window`', () => {
    setLocale('sv');
    expect(textDirection.current).toBe('ltr');
  });
});
