import { describe, expect, it } from 'vitest';

import { validateLocaleCode } from './code';

describe('validateLocaleCode', () => {
  it('returns valid for an ISO 639-1 two-letter code', () => {
    expect(validateLocaleCode('en')).toEqual({
      valid: true,
    });
    expect(validateLocaleCode('sv')).toEqual({
      valid: true,
    });
    expect(validateLocaleCode('is')).toEqual({
      valid: true,
    });
  });

  it('returns valid for a BCP 47 region variant', () => {
    expect(validateLocaleCode('en-US')).toEqual({
      valid: true,
    });
    expect(validateLocaleCode('pt-BR')).toEqual({
      valid: true,
    });
    expect(validateLocaleCode('zh-CN')).toEqual({
      valid: true,
    });
  });

  it('returns valid for a BCP 47 script variant', () => {
    expect(validateLocaleCode('zh-Hans')).toEqual({
      valid: true,
    });
    expect(validateLocaleCode('sr-Cyrl')).toEqual({
      valid: true,
    });
  });

  it('returns valid for a BCP 47 script and region variant', () => {
    expect(validateLocaleCode('zh-Hans-CN')).toEqual({
      valid: true,
    });
  });

  it('returns an unknown-language issue with a suggestion for a typo', () => {
    const result = validateLocaleCode('ic');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('unknown-language');
    expect([
      'id',
      'is',
      'it',
    ]).toContain(result.suggestion);
  });

  it('returns an invalid-structure issue for codes that break BCP 47', () => {
    const result = validateLocaleCode('swedish');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('invalid-structure');
  });

  it('returns an invalid-structure issue for underscore separators', () => {
    const result = validateLocaleCode('en_US');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('invalid-structure');
  });

  it('returns an invalid-structure issue for uppercase language tags', () => {
    const result = validateLocaleCode('EN');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('invalid-structure');
  });

  it('picks a common-language code as valid without warning', () => {
    const result = validateLocaleCode('sw');

    expect(result.valid).toBe(true);
  });

  it('returns an invalid-structure issue without a suggestion for an empty code', () => {
    const result = validateLocaleCode('');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('invalid-structure');
    expect(result.suggestion).toBeUndefined();
  });

  it('returns an invalid-structure issue without a suggestion for a long pseudo-code', () => {
    const result = validateLocaleCode('completely-unknown-locale-tag');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('invalid-structure');
    expect(result.suggestion).toBeUndefined();
  });

  it('returns valid for a BCP 47 digit-prefix variant subtag', () => {
    expect(validateLocaleCode('de-CH-1996')).toEqual({
      valid: true,
    });
    expect(validateLocaleCode('de-1901')).toEqual({
      valid: true,
    });
  });

  it('returns valid for a BCP 47 word-form variant subtag', () => {
    expect(validateLocaleCode('ca-ES-valencia')).toEqual({
      valid: true,
    });
  });

  it('returns valid for multiple BCP 47 variant subtags', () => {
    expect(validateLocaleCode('sl-rozaj-biske')).toEqual({
      valid: true,
    });
  });

  it('returns valid for a BCP 47 extension subtag', () => {
    expect(validateLocaleCode('en-US-u-ca-gregory')).toEqual({
      valid: true,
    });
  });

  it('returns valid for a BCP 47 extlang subtag', () => {
    expect(validateLocaleCode('zh-yue-Hant-HK')).toEqual({
      valid: true,
    });
  });

  it('returns an invalid-structure issue for a malformed variant subtag', () => {
    const result = validateLocaleCode('de-CH-19');

    expect(result.valid).toBe(false);
    expect(result.issue).toBe('invalid-structure');
  });
});
