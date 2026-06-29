import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { expandTxSourcePlaceholders } from './tx-icu';

function tx(value: string): Token {
  return {
    type: 'tx-source',
    value,
  };
}

function types(tokens: Token[]): string[] {
  return tokens.map((token) => token.type);
}

function values(tokens: Token[]): string[] {
  return tokens.map((token) => token.value);
}

describe('expandTxSourcePlaceholders', () => {
  it('returns input unchanged when no tx-source tokens', () => {
    const input: Token[] = [
      {
        type: 'keyword',
        value: 'return',
      },
      {
        type: 'plain',
        value: ' ',
      },
    ];
    expect(expandTxSourcePlaceholders(input)).toEqual(input);
  });

  it('returns tx-source unchanged when no placeholders', () => {
    const input = [
      tx("'Hello, world'"),
    ];
    expect(expandTxSourcePlaceholders(input)).toEqual(input);
  });

  it('expands a single placeholder', () => {
    const result = expandTxSourcePlaceholders([
      tx("'Hi {name}'"),
    ]);
    expect(types(result)).toEqual([
      'tx-source',
      'tx-source',
      'punct',
      'tx-placeholder',
      'punct',
      'tx-source',
    ]);
    expect(values(result)).toEqual([
      "'",
      'Hi ',
      '{',
      'name',
      '}',
      "'",
    ]);
  });

  it('expands multiple placeholders in one string', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{first} and {second}'"),
    ]);
    expect(types(result)).toEqual([
      'tx-source',
      'punct',
      'tx-placeholder',
      'punct',
      'tx-source',
      'punct',
      'tx-placeholder',
      'punct',
      'tx-source',
    ]);
    expect(values(result)).toEqual([
      "'",
      '{',
      'first',
      '}',
      ' and ',
      '{',
      'second',
      '}',
      "'",
    ]);
  });

  it('preserves the quote character of the source string', () => {
    const result = expandTxSourcePlaceholders([
      tx('"{a}"'),
    ]);
    expect(values(result)).toEqual([
      '"',
      '{',
      'a',
      '}',
      '"',
    ]);
  });

  it('marks ICU plural shape', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{count, plural, one {item} other {items}}'"),
    ]);
    expect(types(result)).toContain('tx-placeholder');
    expect(types(result)).toContain('tx-icu-keyword');
    expect(types(result)).toContain('tx-icu-key');

    const keyword = result.find((token) => token.type === 'tx-icu-keyword');
    expect(keyword?.value).toBe('plural');

    const placeholder = result.find((token) => token.type === 'tx-placeholder');
    expect(placeholder?.value).toBe('count');

    const keys = result
      .filter((token) => token.type === 'tx-icu-key')
      .map((token) => token.value);
    expect(keys).toEqual([
      'one',
      'other',
    ]);
  });

  it('marks ICU select shape', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{gender, select, male {he} female {she} other {they}}'"),
    ]);
    const keyword = result.find((token) => token.type === 'tx-icu-keyword');
    expect(keyword?.value).toBe('select');

    const keys = result
      .filter((token) => token.type === 'tx-icu-key')
      .map((token) => token.value);
    expect(keys).toEqual([
      'male',
      'female',
      'other',
    ]);
  });

  it('marks the hash sign inside a branch as tx-icu-hash', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{count, plural, one {# item} other {# items}}'"),
    ]);
    const hashes = result.filter((token) => token.type === 'tx-icu-hash');
    expect(hashes).toHaveLength(2);
    expect(hashes[0]?.value).toBe('#');
  });

  it('marks numeric branch keys `=0` and `=1`', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{count, plural, =0 {none} =1 {one} other {many}}'"),
    ]);
    const keys = result
      .filter((token) => token.type === 'tx-icu-key')
      .map((token) => token.value);
    expect(keys).toEqual([
      '=0',
      '=1',
      'other',
    ]);
  });

  it('expands nested placeholders inside branches', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{count, plural, one {1 message from {sender}} other {# messages}}'"),
    ]);
    const placeholders = result
      .filter((token) => token.type === 'tx-placeholder')
      .map((token) => token.value);
    expect(placeholders).toEqual([
      'count',
      'sender',
    ]);
  });

  it('marks number/date keyword shapes', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{price, number, ::currency/USD}'"),
    ]);
    const keyword = result.find((token) => token.type === 'tx-icu-keyword');
    expect(keyword?.value).toBe('number');
  });

  it('preserves an unmatched brace as plain tx-source', () => {
    const result = expandTxSourcePlaceholders([
      tx("'broken {name'"),
    ]);
    expect(result.some((token) => token.type === 'tx-placeholder')).toBe(false);
  });

  it('preserves whitespace around ICU syntax via plain tokens', () => {
    const result = expandTxSourcePlaceholders([
      tx("'{count, plural, one {item} other {items}}'"),
    ]);
    const joined = values(result).join('');
    expect(joined).toBe("'{count, plural, one {item} other {items}}'");
  });

  it('marks a tx-source value without surrounding quotes', () => {
    const result = expandTxSourcePlaceholders([
      tx('Hi {name}'),
    ]);
    expect(types(result)).toEqual([
      'tx-source',
      'punct',
      'tx-placeholder',
      'punct',
    ]);
  });

  it('preserves non tx-source tokens between expansions', () => {
    const result = expandTxSourcePlaceholders([
      {
        type: 'keyword',
        value: 'return',
      },
      tx("'{a}'"),
      {
        type: 'punct',
        value: ';',
      },
    ]);
    expect(result[0]).toEqual({
      type: 'keyword',
      value: 'return',
    });
    expect(result[result.length - 1]).toEqual({
      type: 'punct',
      value: ';',
    });
  });
});
