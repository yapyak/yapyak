import { describe, expect, it } from 'vitest';

import { nullify } from './nullify';

describe('nullify', () => {
  it('returns the value when defined', () => {
    expect(nullify('Hello')).toBe('Hello');
  });

  it('returns `null` when value is `undefined`', () => {
    expect(nullify(undefined)).toBeNull();
  });
});
