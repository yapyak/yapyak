import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

import { parseMessageKey, toMessageKey } from './message-key';

describe('parseMessageKey', () => {
  it('parses a key with no context into a bare source', () => {
    expect(parseMessageKey('Save')).toEqual({
      source: 'Save',
    });
  });

  it('parses a key with context into source and context', () => {
    expect(parseMessageKey('Save@button')).toEqual({
      context: 'button',
      source: 'Save',
    });
  });
});

describe('toMessageKey', () => {
  it('builds a key from source when context is undefined', () => {
    expect(toMessageKey('Save')).toBe('Save');
  });

  it('builds a key from source and context joined by `@`', () => {
    expect(toMessageKey('Save', 'button')).toBe('Save@button');
  });
});

describe('properties', () => {
  const sourceWithoutSeparator = fc.string().filter((s) => !s.includes('@'));

  it.prop([
    sourceWithoutSeparator,
  ])(
    'preserves every source through a roundtrip when no context is supplied',
    (source) => {
      expect(parseMessageKey(toMessageKey(source))).toEqual({
        source,
      });
    },
  );

  it.prop([
    sourceWithoutSeparator,
    fc.string(),
  ])(
    'preserves every source and context pair through a roundtrip',
    (source, context) => {
      expect(parseMessageKey(toMessageKey(source, context))).toEqual({
        context,
        source,
      });
    },
  );
});
