import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { splitJsxBrackets } from './jsx-bracket';

describe('splitJsxBrackets', () => {
  it('splits the opening bracket from a tag name', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
    ];

    expect(splitJsxBrackets(tokens)).toEqual([
      {
        kind: 'punct',
        value: '<',
      },
      {
        kind: 'jsx-tag',
        value: 'button',
      },
    ]);
  });

  it('splits the closing bracket from a tag name', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '</button',
      },
    ];

    expect(splitJsxBrackets(tokens)).toEqual([
      {
        kind: 'punct',
        value: '</',
      },
      {
        kind: 'jsx-tag',
        value: 'button',
      },
    ]);
  });

  it('returns a `punct` token for a self-closing bracket', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '/>',
      },
    ];

    expect(splitJsxBrackets(tokens)).toEqual([
      {
        kind: 'punct',
        value: '/>',
      },
    ]);
  });

  it('preserves a token that is not a tag', () => {
    const tokens: Token[] = [
      {
        kind: 'plain',
        value: 'Hello',
      },
    ];

    expect(splitJsxBrackets(tokens)).toEqual([
      {
        kind: 'plain',
        value: 'Hello',
      },
    ]);
  });

  it('preserves a doctype token', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<!DOCTYPE html>',
      },
    ];

    expect(splitJsxBrackets(tokens)).toEqual([
      {
        kind: 'jsx-tag',
        value: '<!DOCTYPE html>',
      },
    ]);
  });
});
