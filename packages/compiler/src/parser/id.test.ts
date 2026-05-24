import { describe, expect, it } from 'vitest';

import { toMessageId } from './id';

describe('toMessageId', () => {
  it('returns a 12-char hex string', () => {
    const id = toMessageId('Hello');
    expect(id).toMatch(/^[0-9a-f]{12}$/);
  });

  it('is deterministic for the same input', () => {
    expect(toMessageId('Hello')).toBe(toMessageId('Hello'));
    expect(toMessageId('Hi {name}', 'greeting')).toBe(
      toMessageId('Hi {name}', 'greeting'),
    );
  });

  it('produces different ids for different sources', () => {
    expect(toMessageId('A')).not.toBe(toMessageId('B'));
  });

  it('produces different ids for same source with different context', () => {
    expect(toMessageId('Save')).not.toBe(toMessageId('Save', 'button'));
    expect(toMessageId('Save', 'button')).not.toBe(
      toMessageId('Save', 'menu item'),
    );
  });

  it('treats undefined context as no context', () => {
    expect(toMessageId('Save')).toBe(toMessageId('Save', undefined));
  });
});
