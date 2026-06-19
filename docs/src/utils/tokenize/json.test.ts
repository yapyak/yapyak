import type { TokenType } from './type';

import { describe, expect, it } from 'vitest';

import { tokenizeJson } from './json';

function types(code: string): TokenType[] {
  return tokenizeJson(code)
    .filter((token) => token.type !== 'plain')
    .map((token) => token.type);
}

describe('tokenizeJson', () => {
  it('returns a `punct` token for an opening brace', () => {
    expect(types('{}').filter((type) => type === 'punct')).toEqual([
      'punct',
      'punct',
    ]);
  });

  it('returns a `string` token for a key', () => {
    expect(types('{"Hello": 1}')).toContain('string');
  });

  it('returns a `tx-source` token for a string value after `:`', () => {
    expect(types('{"key": "Hello"}')).toContain('tx-source');
  });

  it('returns a `number` token for a numeric value', () => {
    expect(types('{"count": 42}')).toContain('number');
  });

  it('returns a `literal` token for `true`', () => {
    expect(types('{"open": true}')).toContain('literal');
  });

  it('returns a `literal` token for `null`', () => {
    expect(types('{"value": null}')).toContain('literal');
  });
});
