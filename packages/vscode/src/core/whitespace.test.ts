import { describe, expect, it } from 'vitest';

import { isWhitespace, skipWhitespace } from './whitespace';

describe('isWhitespace', () => {
  it('returns true for a tab', () => {
    expect(isWhitespace('\t')).toBe(true);
  });

  it('returns false for a letter', () => {
    expect(isWhitespace('a')).toBe(false);
  });
});

describe('skipWhitespace', () => {
  it('returns the offset of the first character that is not whitespace', () => {
    expect(skipWhitespace('  \n"Hello"', 0)).toBe(3);
  });

  it('returns the length when only whitespace remains', () => {
    expect(skipWhitespace('"Hello"  ', 7)).toBe(9);
  });
});
