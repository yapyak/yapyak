import { describe, expect, it } from 'vitest';

import { capitalize } from './capitalize';

describe('capitalize', () => {
  it('uppercases the first character', () => {
    expect(capitalize('guide')).toBe('Guide');
  });

  it('leaves an already-capitalized value unchanged', () => {
    expect(capitalize('Guide')).toBe('Guide');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalize('')).toBe('');
  });
});
