import { describe, expect, it } from 'vitest';

import {
  findFreeIdentifier,
  findFreeIdentifiers,
  hasIdentifier,
  isIdentifierCharacter,
} from './identifier';

describe('isIdentifierCharacter', () => {
  it('returns true for a letter', () => {
    expect(isIdentifierCharacter('a')).toBe(true);
  });

  it('returns true for a digit', () => {
    expect(isIdentifierCharacter('5')).toBe(true);
  });

  it('returns true for `_`', () => {
    expect(isIdentifierCharacter('_')).toBe(true);
  });

  it('returns true for `$`', () => {
    expect(isIdentifierCharacter('$')).toBe(true);
  });

  it('returns false for whitespace', () => {
    expect(isIdentifierCharacter(' ')).toBe(false);
  });

  it('returns false for punctuation', () => {
    expect(isIdentifierCharacter('.')).toBe(false);
  });

  it('returns false for `undefined`', () => {
    expect(isIdentifierCharacter(undefined)).toBe(false);
  });
});

describe('hasIdentifier', () => {
  it('returns true when the identifier appears as a standalone word', () => {
    expect(hasIdentifier('const x = foo();', 'foo')).toBe(true);
  });

  it('returns false when the candidate is only a substring of another identifier', () => {
    expect(hasIdentifier('const fooBar = 1;', 'foo')).toBe(false);
  });

  it('returns false when the candidate is a suffix of another identifier', () => {
    expect(hasIdentifier('const myFoo = 1;', 'foo')).toBe(false);
  });

  it('returns true when the identifier appears more than once', () => {
    expect(hasIdentifier('foo + foo + bar', 'foo')).toBe(true);
  });

  it('returns false when the identifier is absent', () => {
    expect(hasIdentifier('const x = 1;', 'foo')).toBe(false);
  });
});

describe('findFreeIdentifier', () => {
  it('returns the preferred name when it is unused', () => {
    expect(findFreeIdentifier('const x = 1;', '_useYapyak')).toBe('_useYapyak');
  });

  it('returns the preferred name with a numeric suffix when the original collides', () => {
    expect(findFreeIdentifier('const _useYapyak = 1;', '_useYapyak')).toBe(
      '_useYapyak_$0',
    );
  });

  it('returns the next free numeric suffix when both the preferred and the first suffix collide', () => {
    const source = 'const _useYapyak = 1; const _useYapyak_$0 = 2;';
    expect(findFreeIdentifier(source, '_useYapyak')).toBe('_useYapyak_$1');
  });
});

describe('findFreeIdentifiers', () => {
  it('lists no identifiers when count is zero', () => {
    expect(findFreeIdentifiers('const x = 1;', '_id', 0)).toEqual([]);
  });

  it('lists every requested identifier when none collide', () => {
    expect(findFreeIdentifiers('const x = 1;', '_id', 3)).toEqual([
      '_id0',
      '_id1',
      '_id2',
    ]);
  });

  it('skips identifiers that already appear in the source', () => {
    expect(findFreeIdentifiers('const _id0 = 1;', '_id', 2)).toEqual([
      '_id1',
      '_id2',
    ]);
  });
});
