import { describe, expect, it } from 'vitest';

import { findMatchingBraceIndex } from './matching-brace';

describe('findMatchingBraceIndex', () => {
  it('returns the index of the matching closing brace at depth 1', () => {
    expect(findMatchingBraceIndex('{x}', 0)).toBe(2);
  });

  it('returns the index of the outer closing brace when braces are nested', () => {
    expect(findMatchingBraceIndex('{a{b}c}', 0)).toBe(6);
  });

  it('returns the source length when no closing brace is reached', () => {
    expect(findMatchingBraceIndex('{abc', 0)).toBe(4);
  });
});
