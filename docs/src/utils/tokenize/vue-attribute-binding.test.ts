import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { expandVueAttributeBindings } from './vue-attribute-binding';

const HELLO_TOKEN: Token = {
  type: 'plain',
  value: 'Hello',
};

const tokenizeStub = () => [
  HELLO_TOKEN,
];

describe('expandVueAttributeBindings', () => {
  it('expands a `:attr="..."` binding by re-tokenizing the inner string', () => {
    const tokens: Token[] = [
      {
        type: 'punct',
        value: ':',
      },
      {
        type: 'fn-call',
        value: 'value',
      },
      {
        type: 'punct',
        value: '=',
      },
      {
        type: 'string',
        value: '"World"',
      },
    ];

    const result = expandVueAttributeBindings(tokens, tokenizeStub);
    expect(result).toContain(HELLO_TOKEN);
  });

  it('expands an `@event="..."` binding by re-tokenizing the inner string', () => {
    const tokens: Token[] = [
      {
        type: 'punct',
        value: '@',
      },
      {
        type: 'fn-call',
        value: 'click',
      },
      {
        type: 'punct',
        value: '=',
      },
      {
        type: 'string',
        value: '"World"',
      },
    ];

    const result = expandVueAttributeBindings(tokens, tokenizeStub);
    expect(result).toContain(HELLO_TOKEN);
  });

  it('preserves a string value when no `:` or `@` binding precedes it', () => {
    const tokens: Token[] = [
      {
        type: 'fn-call',
        value: 'class',
      },
      {
        type: 'punct',
        value: '=',
      },
      {
        type: 'string',
        value: '"Hello"',
      },
    ];

    expect(expandVueAttributeBindings(tokens, tokenizeStub)).toEqual(tokens);
  });
});
