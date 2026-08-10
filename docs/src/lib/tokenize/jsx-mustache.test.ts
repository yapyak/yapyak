import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { markJsxMustaches } from './jsx-mustache';

describe('markJsxMustaches', () => {
  it('marks a `punct` brace that follows a `jsx-brace`', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-brace',
        value: '{',
      },
      {
        kind: 'punct',
        value: '{',
      },
    ];
    markJsxMustaches(tokens);

    expect(tokens[1]?.kind).toBe('jsx-brace');
  });

  it('marks a `punct` brace that precedes a `jsx-brace`', () => {
    const tokens: Token[] = [
      {
        kind: 'punct',
        value: '}',
      },
      {
        kind: 'jsx-brace',
        value: '}',
      },
    ];
    markJsxMustaches(tokens);

    expect(tokens[0]?.kind).toBe('jsx-brace');
  });

  it('preserves a `punct` brace with no adjacent `jsx-brace`', () => {
    const tokens: Token[] = [
      {
        kind: 'punct',
        value: '{',
      },
      {
        kind: 'plain',
        value: 'Hello',
      },
      {
        kind: 'punct',
        value: '}',
      },
    ];
    markJsxMustaches(tokens);

    expect(tokens[0]?.kind).toBe('punct');
    expect(tokens[2]?.kind).toBe('punct');
  });

  it('preserves a `punct` brace adjacent to the opposite brace', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-brace',
        value: '}',
      },
      {
        kind: 'punct',
        value: '{',
      },
    ];
    markJsxMustaches(tokens);

    expect(tokens[1]?.kind).toBe('punct');
  });
});
