import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { findNextSignificant } from './significant';

describe('findNextSignificant', () => {
  it('returns the index of the next non-whitespace token', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: '  ',
      },
      {
        type: 'keyword',
        value: 'const',
      },
    ];

    expect(findNextSignificant(tokens, 0)).toBe(1);
  });

  it('returns `undefined` when no significant token follows', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: '  ',
      },
    ];

    expect(findNextSignificant(tokens, 0)).toBeUndefined();
  });
});
