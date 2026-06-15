import { describe, expect, it } from 'vitest';

import { resolveMaxTokens } from './max-token';

describe('resolveMaxTokens', () => {
  it('returns the override when one is provided', () => {
    expect(
      resolveMaxTokens({
        cap: 32_000,
        floor: 1024,
        itemCount: 10,
        localeCount: 2,
        override: 500,
        perItem: 96,
      }),
    ).toBe(500);
  });

  it('returns the floor when the projected count is below it', () => {
    expect(
      resolveMaxTokens({
        cap: 32_000,
        floor: 1024,
        itemCount: 1,
        localeCount: 1,
        override: undefined,
        perItem: 96,
      }),
    ).toBe(1024);
  });

  it('returns the cap when the projected count exceeds it', () => {
    expect(
      resolveMaxTokens({
        cap: 4000,
        floor: 1024,
        itemCount: 100,
        localeCount: 5,
        override: undefined,
        perItem: 96,
      }),
    ).toBe(4000);
  });

  it('returns the projected count when within the floor and cap', () => {
    expect(
      resolveMaxTokens({
        cap: 32_000,
        floor: 1024,
        itemCount: 20,
        localeCount: 2,
        override: undefined,
        perItem: 96,
      }),
    ).toBe(20 * 2 * 96);
  });
});
