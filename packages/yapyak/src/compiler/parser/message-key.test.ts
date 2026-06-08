import { describe, expect, it } from 'vitest';

import { parseMessageKey, toMessageKey } from './message-key';

describe('parseMessageKey', () => {
  it('parses a key with no context into a bare source', () => {
    expect(parseMessageKey('Save')).toEqual({ source: 'Save' });
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
