import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { reclassifyJsxText } from './jsx-text';

describe('reclassifyJsxText', () => {
  it('marks a `keyword` token inside JSX text as `plain`', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<div',
      },
      {
        kind: 'punct',
        value: '>',
      },
      {
        kind: 'keyword',
        value: 'return',
      },
      {
        kind: 'jsx-tag',
        value: '</div',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    reclassifyJsxText(tokens);
    expect(tokens[2]?.kind).toBe('plain');
  });

  it('marks the opening `{` of a JSX expression as `jsx-brace`', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<div',
      },
      {
        kind: 'punct',
        value: '>',
      },
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
      {
        kind: 'jsx-tag',
        value: '</div',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    reclassifyJsxText(tokens);
    expect(tokens[2]?.kind).toBe('jsx-brace');
    expect(tokens[4]?.kind).toBe('jsx-brace');
  });

  it('preserves a `keyword` token inside a `<script>` raw-text block', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<script',
      },
      {
        kind: 'punct',
        value: '>',
      },
      {
        kind: 'keyword',
        value: 'return',
      },
      {
        kind: 'jsx-tag',
        value: '</script',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    reclassifyJsxText(tokens);
    expect(tokens[2]?.kind).toBe('keyword');
  });
});
