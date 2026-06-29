import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { expandVueAttributeBindings } from './vue-attribute-binding';

const HELLO_TOKEN: Token = {
  kind: 'plain',
  value: 'Hello',
};

const tokenizeStub = () => [
  HELLO_TOKEN,
];

describe('expandVueAttributeBindings', () => {
  it('expands a `:attr="..."` binding by re-tokenizing the inner string', () => {
    const tokens: Token[] = [
      {
        kind: 'punct',
        value: ':',
      },
      {
        kind: 'fn-call',
        value: 'value',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'string',
        value: '"World"',
      },
    ];

    const result = expandVueAttributeBindings(tokens, tokenizeStub);
    expect(result).toContain(HELLO_TOKEN);
  });

  it('expands an `@event="..."` binding by re-tokenizing the inner string', () => {
    const tokens: Token[] = [
      {
        kind: 'punct',
        value: '@',
      },
      {
        kind: 'fn-call',
        value: 'click',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'string',
        value: '"World"',
      },
    ];

    const result = expandVueAttributeBindings(tokens, tokenizeStub);
    expect(result).toContain(HELLO_TOKEN);
  });

  it('preserves a string value when no `:` or `@` binding precedes it', () => {
    const tokens: Token[] = [
      {
        kind: 'fn-call',
        value: 'class',
      },
      {
        kind: 'punct',
        value: '=',
      },
      {
        kind: 'string',
        value: '"Hello"',
      },
    ];

    expect(expandVueAttributeBindings(tokens, tokenizeStub)).toEqual(tokens);
  });
});
