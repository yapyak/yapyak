import { describe, expect, it } from 'vitest';

import { isUnsafeKey } from './unsafe-key';

describe('isUnsafeKey', () => {
  it('returns `true` for `__proto__`', () => {
    expect(isUnsafeKey('__proto__')).toBe(true);
  });

  it('returns `true` for `constructor`', () => {
    expect(isUnsafeKey('constructor')).toBe(true);
  });

  it('returns `true` for `prototype`', () => {
    expect(isUnsafeKey('prototype')).toBe(true);
  });

  it('returns `false` for a normal file-path key', () => {
    expect(isUnsafeKey('src/foo.ts')).toBe(false);
  });

  it('returns `false` for an empty string', () => {
    expect(isUnsafeKey('')).toBe(false);
  });

  it('returns `false` for a key that contains `__proto__` as a substring', () => {
    expect(isUnsafeKey('my__proto__file')).toBe(false);
  });
});
