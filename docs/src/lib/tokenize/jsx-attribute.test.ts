import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { markJsxAttributes } from './jsx-attribute';

describe('markJsxAttributes', () => {
  it('marks an attribute name inside an opening tag', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'title',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'string',
        value: '"Save"',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[2]?.kind).toBe('jsx-attribute');
  });

  it('marks a keyword-shaped attribute name', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<label',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'keyword',
        value: 'for',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'string',
        value: '"Settings"',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[2]?.kind).toBe('jsx-attribute');
  });

  it('marks every attribute name in the same tag', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'title',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'string',
        value: '"Save"',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'disabled',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[6]?.kind).toBe('jsx-attribute');
  });

  it('marks an attribute name after an expression value', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'title',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'punct',
        value: '{',
      },
      {
        kind: 'plain',
        value: 'label',
      },
      {
        kind: 'punct',
        value: '}',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'disabled',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[8]?.kind).toBe('jsx-attribute');
  });

  it('preserves an identifier inside an attribute expression', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'title',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'punct',
        value: '{',
      },
      {
        kind: 'plain',
        value: 'label',
      },
      {
        kind: 'punct',
        value: '}',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[5]?.kind).toBe('plain');
  });

  it('preserves an identifier in JSX text', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
      {
        kind: 'punct',
        value: '>',
      },
      {
        kind: 'plain',
        value: 'Hello',
      },
      {
        kind: 'jsx-tag',
        value: '</button',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[2]?.kind).toBe('plain');
  });

  it('preserves an identifier inside a closing tag', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '</button',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'plain',
        value: 'title',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[2]?.kind).toBe('plain');
  });

  it('preserves a number token in an attribute position', () => {
    const tokens: Token[] = [
      {
        kind: 'jsx-tag',
        value: '<button',
      },
      {
        kind: 'plain',
        value: ' ',
      },
      {
        kind: 'number',
        value: '2',
      },
      {
        kind: 'punct',
        value: '>',
      },
    ];
    markJsxAttributes(tokens);

    expect(tokens[2]?.kind).toBe('number');
  });
});
