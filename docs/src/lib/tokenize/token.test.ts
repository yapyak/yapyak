import { describe, expect, it } from 'vitest';

import { scanToken } from './token';

describe('scanToken', () => {
  it('returns a `keyword` token for a reserved word', () => {
    expect(scanToken('const x = 1', 0, 'ts', undefined)).toEqual({
      end: 5,
      token: {
        kind: 'keyword',
        value: 'const',
      },
    });
  });

  it('returns a `literal` token for `true`', () => {
    expect(scanToken('true', 0, 'ts', undefined)).toEqual({
      end: 4,
      token: {
        kind: 'literal',
        value: 'true',
      },
    });
  });

  it('returns a `type` token for a built-in like `string`', () => {
    expect(scanToken('string', 0, 'ts', undefined)).toEqual({
      end: 6,
      token: {
        kind: 'type',
        value: 'string',
      },
    });
  });

  it('returns a `fn-call` token for an identifier followed by `(`', () => {
    expect(scanToken('hello(', 0, 'ts', undefined)?.token).toEqual({
      kind: 'fn-call',
      value: 'hello',
    });
  });

  it('returns a `comment` token for a line comment', () => {
    expect(scanToken('// Hello', 0, 'ts', undefined)?.token).toEqual({
      kind: 'comment',
      value: '// Hello',
    });
  });

  it('returns a `comment` token for a block comment', () => {
    expect(scanToken('/* Hello */', 0, 'ts', undefined)?.token).toEqual({
      kind: 'comment',
      value: '/* Hello */',
    });
  });

  it('returns a `string` token for a double-quoted string', () => {
    expect(scanToken('"Hello"', 0, 'ts', undefined)?.token).toEqual({
      kind: 'string',
      value: '"Hello"',
    });
  });

  it('returns a `template` token for a backtick string', () => {
    expect(scanToken('`Hello`', 0, 'ts', undefined)?.token).toEqual({
      kind: 'template',
      value: '`Hello`',
    });
  });

  it('returns a `number` token for a decimal literal', () => {
    expect(scanToken('42', 0, 'ts', undefined)?.token).toEqual({
      kind: 'number',
      value: '42',
    });
  });

  it('returns a `number` token for a hex literal', () => {
    expect(scanToken('0x1a', 0, 'ts', undefined)?.token).toEqual({
      kind: 'number',
      value: '0x1a',
    });
  });

  it('returns a `spread` token for `...`', () => {
    expect(scanToken('...', 0, 'ts', undefined)?.token).toEqual({
      kind: 'spread',
      value: '...',
    });
  });

  it('returns a `decorator` token for an `@name` annotation', () => {
    expect(scanToken('@Hello', 0, 'ts', undefined)?.token).toEqual({
      kind: 'decorator',
      value: '@Hello',
    });
  });

  it('returns a `punct` token for a single punctuation character', () => {
    expect(scanToken(';', 0, 'ts', undefined)?.token).toEqual({
      kind: 'punct',
      value: ';',
    });
  });

  it('returns a `jsx-tag` token for a JSX opening tag', () => {
    expect(scanToken('<div', 0, 'tsx', undefined)?.token).toEqual({
      kind: 'jsx-tag',
      value: '<div',
    });
  });

  it('returns a `regex` token after a `(` punctuation', () => {
    expect(
      scanToken('/abc/g', 0, 'ts', {
        kind: 'punct',
        value: '(',
      })?.token,
    ).toEqual({
      kind: 'regex',
      value: '/abc/g',
    });
  });

  it('returns `undefined` at the end of input', () => {
    expect(scanToken('', 0, 'ts', undefined)).toBeUndefined();
  });
});
