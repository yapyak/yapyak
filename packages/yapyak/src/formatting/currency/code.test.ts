import { describe, expect, it } from 'vitest';

import { isCurrencyCode, parseCurrencyCode } from './code';

describe('isCurrencyCode', () => {
  it('returns `true` for a code the host runtime supports', () => {
    expect(isCurrencyCode('USD')).toBe(true);
    expect(isCurrencyCode('EUR')).toBe(true);
    expect(isCurrencyCode('SEK')).toBe(true);
  });

  it('returns `false` for a code outside the host runtime support set', () => {
    expect(isCurrencyCode('XYZ')).toBe(false);
    expect(isCurrencyCode('AAA')).toBe(false);
  });

  it('returns `false` for a lowercase code', () => {
    expect(isCurrencyCode('usd')).toBe(false);
  });

  it('returns `false` for an empty string', () => {
    expect(isCurrencyCode('')).toBe(false);
  });

  it('returns `false` for a code that is not three letters', () => {
    expect(isCurrencyCode('USDD')).toBe(false);
    expect(isCurrencyCode('US')).toBe(false);
  });
});

describe('parseCurrencyCode', () => {
  it('returns the upper-cased code for an uppercase input', () => {
    expect(parseCurrencyCode('USD')).toBe('USD');
  });

  it('returns the upper-cased code for a lowercase input', () => {
    expect(parseCurrencyCode('usd')).toBe('USD');
  });

  it('returns the upper-cased code for a mixed-case input', () => {
    expect(parseCurrencyCode('eUr')).toBe('EUR');
  });

  it('returns `null` for a code outside the host runtime support set', () => {
    expect(parseCurrencyCode('XYZ')).toBeNull();
    expect(parseCurrencyCode('AAA')).toBeNull();
  });

  it('returns `null` for an empty string', () => {
    expect(parseCurrencyCode('')).toBeNull();
  });

  it('returns `null` for a code that is not three letters', () => {
    expect(parseCurrencyCode('USDD')).toBeNull();
    expect(parseCurrencyCode('US')).toBeNull();
  });
});
