import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { mergePlainTokens } from './plain-token';

describe('mergePlainTokens', () => {
  it('merges every adjacent `plain` token into a single token', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'Hello',
      },
      {
        type: 'plain',
        value: ' ',
      },
      {
        type: 'plain',
        value: 'World',
      },
    ];

    expect(mergePlainTokens(tokens)).toEqual([
      {
        type: 'plain',
        value: 'Hello World',
      },
    ]);
  });

  it('preserves a non-`plain` token between two `plain` tokens', () => {
    const tokens: Token[] = [
      {
        type: 'plain',
        value: 'Hello ',
      },
      {
        type: 'keyword',
        value: 'const',
      },
      {
        type: 'plain',
        value: ' World',
      },
    ];

    expect(mergePlainTokens(tokens)).toEqual([
      {
        type: 'plain',
        value: 'Hello ',
      },
      {
        type: 'keyword',
        value: 'const',
      },
      {
        type: 'plain',
        value: ' World',
      },
    ]);
  });

  it('returns an empty list for an empty input', () => {
    expect(mergePlainTokens([])).toEqual([]);
  });
});
