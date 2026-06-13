import { describe, expect, it } from 'vitest';

import { isCurrency } from './code';

describe('isCurrency', () => {
  it('returns `true` for a code the host runtime supports', () => {
    expect(isCurrency('USD')).toBe(true);
    expect(isCurrency('EUR')).toBe(true);
    expect(isCurrency('SEK')).toBe(true);
  });

  it('returns `false` for a code outside the host runtime support set', () => {
    expect(isCurrency('XYZ')).toBe(false);
    expect(isCurrency('AAA')).toBe(false);
  });

  it('returns `false` for a lowercase code', () => {
    expect(isCurrency('usd')).toBe(false);
  });

  it('returns `false` for an empty string', () => {
    expect(isCurrency('')).toBe(false);
  });

  it('returns `false` for a code that is not three letters', () => {
    expect(isCurrency('USDD')).toBe(false);
    expect(isCurrency('US')).toBe(false);
  });
});
