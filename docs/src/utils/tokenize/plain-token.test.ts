import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { mergePlainTokens } from './plain-token';

describe('mergePlainTokens', () => {
  it('merges every adjacent `plain` token into a single token', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'Hello',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'World',
      },
    ];

    expect(mergePlainTokens(tokens)).toEqual([
      {
        kind: 'plain',
        value: 'Hello World',
      },
    ]);
  });

  it('preserves a non-`plain` token between two `plain` tokens', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'Hello ',
      },
      {
        kind: 'keyword',
        value: 'const',
      },
      {
        kind: 'plain',
        value: ' World',
      },
    ];

    expect(mergePlainTokens(tokens)).toEqual([
      {
        kind: 'plain',
        value: 'Hello ',
      },
      {
        kind: 'keyword',
        value: 'const',
      },
      {
        kind: 'plain',
        value: ' World',
      },
    ]);
  });

  it('returns an empty list for an empty input', () => {
    expect(mergePlainTokens([])).toEqual([]);
  });
});
