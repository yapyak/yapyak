import type { Token } from './type';

import { describe, expect, it } from 'vitest';

import { expandSourcePlaceholders } from './source-placeholder';

function sourceToken(value: string): Token {
  return {
    kind: 't-source',
    value,
  };
}

function types(tokens: Token[]): string[] {
  return tokens.map((token) => token.kind);
}

function values(tokens: Token[]): string[] {
  return tokens.map((token) => token.value);
}

describe('expandSourcePlaceholders', () => {
  it('returns input unchanged when no t-source tokens', () => {
    const input: Token[] = [
      {
        kind: 'keyword',
        value: 'return',
      },
      {
        kind: 'plain',
        value: ' ',
      },
    ];
    expect(expandSourcePlaceholders(input)).toEqual(input);
  });

  it('returns t-source unchanged when no placeholders', () => {
    const input = [
      sourceToken("'Hello, world'"),
    ];
    expect(expandSourcePlaceholders(input)).toEqual(input);
  });

  it('expands a single placeholder', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'Hi {name}'"),
    ]);
    expect(types(result)).toEqual([
      't-source',
      't-source',
      'punct',
      't-placeholder',
      'punct',
      't-source',
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
    const result = expandSourcePlaceholders([
      sourceToken("'{first} and {second}'"),
    ]);
    expect(types(result)).toEqual([
      't-source',
      'punct',
      't-placeholder',
      'punct',
      't-source',
      'punct',
      't-placeholder',
      'punct',
      't-source',
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
    const result = expandSourcePlaceholders([
      sourceToken('"{a}"'),
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
    const result = expandSourcePlaceholders([
      sourceToken("'{count, plural, one {item} other {items}}'"),
    ]);
    expect(types(result)).toContain('t-placeholder');
    expect(types(result)).toContain('t-icu-keyword');
    expect(types(result)).toContain('t-icu-key');

    const keyword = result.find((token) => token.kind === 't-icu-keyword');
    expect(keyword?.value).toBe('plural');

    const placeholder = result.find((token) => token.kind === 't-placeholder');
    expect(placeholder?.value).toBe('count');

    const keys = result
      .filter((token) => token.kind === 't-icu-key')
      .map((token) => token.value);
    expect(keys).toEqual([
      'one',
      'other',
    ]);
  });

  it('marks ICU select shape', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'{gender, select, male {he} female {she} other {they}}'"),
    ]);
    const keyword = result.find((token) => token.kind === 't-icu-keyword');
    expect(keyword?.value).toBe('select');

    const keys = result
      .filter((token) => token.kind === 't-icu-key')
      .map((token) => token.value);
    expect(keys).toEqual([
      'male',
      'female',
      'other',
    ]);
  });

  it('marks the hash sign inside a branch as t-icu-hash', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'{count, plural, one {# item} other {# items}}'"),
    ]);
    const hashes = result.filter((token) => token.kind === 't-icu-hash');
    expect(hashes).toHaveLength(2);
    expect(hashes[0]?.value).toBe('#');
  });

  it('marks numeric branch keys `=0` and `=1`', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'{count, plural, =0 {none} =1 {one} other {many}}'"),
    ]);
    const keys = result
      .filter((token) => token.kind === 't-icu-key')
      .map((token) => token.value);
    expect(keys).toEqual([
      '=0',
      '=1',
      'other',
    ]);
  });

  it('expands nested placeholders inside branches', () => {
    const result = expandSourcePlaceholders([
      sourceToken(
        "'{count, plural, one {1 message from {sender}} other {# messages}}'",
      ),
    ]);
    const placeholders = result
      .filter((token) => token.kind === 't-placeholder')
      .map((token) => token.value);
    expect(placeholders).toEqual([
      'count',
      'sender',
    ]);
  });

  it('marks number/date keyword shapes', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'{price, number, ::currency/USD}'"),
    ]);
    const keyword = result.find((token) => token.kind === 't-icu-keyword');
    expect(keyword?.value).toBe('number');
  });

  it('preserves an unmatched brace as plain t-source', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'broken {name'"),
    ]);
    expect(result.some((token) => token.kind === 't-placeholder')).toBe(false);
  });

  it('preserves whitespace around ICU syntax via plain tokens', () => {
    const result = expandSourcePlaceholders([
      sourceToken("'{count, plural, one {item} other {items}}'"),
    ]);
    const joined = values(result).join('');
    expect(joined).toBe("'{count, plural, one {item} other {items}}'");
  });

  it('marks a t-source value without surrounding quotes', () => {
    const result = expandSourcePlaceholders([
      sourceToken('Hi {name}'),
    ]);
    expect(types(result)).toEqual([
      't-source',
      'punct',
      't-placeholder',
      'punct',
    ]);
  });

  it('preserves non t-source tokens between expansions', () => {
    const result = expandSourcePlaceholders([
      {
        kind: 'keyword',
        value: 'return',
      },
      sourceToken("'{a}'"),
      {
        kind: 'punct',
        value: ';',
      },
    ]);
    expect(result[0]).toEqual({
      kind: 'keyword',
      value: 'return',
    });
    expect(result[result.length - 1]).toEqual({
      kind: 'punct',
      value: ';',
    });
  });
});
