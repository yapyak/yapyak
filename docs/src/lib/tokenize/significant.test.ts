import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { findNextSignificant } from './significant';

describe('findNextSignificant', () => {
  it('returns the index of the next non-whitespace token', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: '  ',
      },
      {
        kind: 'keyword',
        value: 'const',
      },
    ];

    expect(findNextSignificant(tokens, 0)).toBe(1);
  });

  it('returns `undefined` when no significant token follows', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: '  ',
      },
    ];

    expect(findNextSignificant(tokens, 0)).toBeUndefined();
  });
});
