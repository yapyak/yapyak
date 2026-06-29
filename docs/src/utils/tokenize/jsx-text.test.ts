import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { reclassifyJsxText } from './jsx-text';

describe('reclassifyJsxText', () => {
  it('marks a `keyword` token inside JSX text as `plain`', () => {
    const tokens: Token[] = [
      {
        type: 'jsx-tag',
        value: '<div',
      },
      {
        type: 'punct',
        value: '>',
      },
      {
        type: 'keyword',
        value: 'return',
      },
      {
        type: 'jsx-tag',
        value: '</div',
      },
      {
        type: 'punct',
        value: '>',
      },
    ];
    reclassifyJsxText(tokens);
    expect(tokens[2]?.type).toBe('plain');
  });

  it('marks the opening `{` of a JSX expression as `jsx-brace`', () => {
    const tokens: Token[] = [
      {
        type: 'jsx-tag',
        value: '<div',
      },
      {
        type: 'punct',
        value: '>',
      },
      {
        type: 'punct',
        value: '{',
      },
      {
        type: 'plain',
        value: 'Hello',
      },
      {
        type: 'punct',
        value: '}',
      },
      {
        type: 'jsx-tag',
        value: '</div',
      },
      {
        type: 'punct',
        value: '>',
      },
    ];
    reclassifyJsxText(tokens);
    expect(tokens[2]?.type).toBe('jsx-brace');
    expect(tokens[4]?.type).toBe('jsx-brace');
  });

  it('preserves a `keyword` token inside a `<script>` raw-text block', () => {
    const tokens: Token[] = [
      {
        type: 'jsx-tag',
        value: '<script',
      },
      {
        type: 'punct',
        value: '>',
      },
      {
        type: 'keyword',
        value: 'return',
      },
      {
        type: 'jsx-tag',
        value: '</script',
      },
      {
        type: 'punct',
        value: '>',
      },
    ];
    reclassifyJsxText(tokens);
    expect(tokens[2]?.type).toBe('keyword');
  });
});
