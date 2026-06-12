import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

import { fromMessageKey, toMessageKey } from './message-key';

describe('toMessageKey', () => {
  it('builds a key from a source without a context', () => {
    expect(toMessageKey('Save')).toBe('["Save",null]');
  });

  it('builds a key from a source and a context', () => {
    expect(toMessageKey('Save', 'button')).toBe('["Save","button"]');
  });
});

describe('fromMessageKey', () => {
  it('parses a key into a source without a context', () => {
    expect(fromMessageKey('["Save",null]')).toEqual({
      source: 'Save',
    });
  });

  it('parses a key into a source and a context', () => {
    expect(fromMessageKey('["Save","button"]')).toEqual({
      context: 'button',
      source: 'Save',
    });
  });
});

describe('properties', () => {
  it.prop([
    fc.string(),
    fc.option(fc.string(), {
      nil: undefined,
    }),
  ])(
    'parses every key back into the source and context that built it',
    (source, context) => {
      const expected =
        context === undefined
          ? {
              source: source.normalize(),
            }
          : {
              context: context.normalize(),
              source: source.normalize(),
            };
      expect(fromMessageKey(toMessageKey(source, context))).toEqual(expected);
    },
  );

  it.prop([
    fc.string(),
    fc.option(fc.string(), {
      nil: undefined,
    }),
    fc.string(),
    fc.option(fc.string(), {
      nil: undefined,
    }),
  ])(
    'builds equal keys for every pair only when source and context match',
    (sourceA, contextA, sourceB, contextB) => {
      const matches =
        sourceA.normalize() === sourceB.normalize() &&
        contextA?.normalize() === contextB?.normalize();
      expect(
        toMessageKey(sourceA, contextA) === toMessageKey(sourceB, contextB),
      ).toBe(matches);
    },
  );
});
