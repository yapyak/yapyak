import { describe, expect, it } from 'vitest';

import { YapyakError } from './error';

describe('YapyakError', () => {
  it('builds an error with the configured message and code', () => {
    const error = new YapyakError('Hello', { code: 'YPK_TEST' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(YapyakError);
    expect(error.message).toBe('Hello');
    expect(error.code).toBe('YPK_TEST');
  });

  it('holds `meta` when supplied', () => {
    const error = new YapyakError('Hello', {
      code: 'YPK_TEST',
      meta: { requested: 'sv' },
    });

    expect(error.meta).toEqual({ requested: 'sv' });
  });

  it('holds `cause` when supplied', () => {
    const original = new Error('Save failed');
    const error = new YapyakError('Hello', {
      cause: original,
      code: 'YPK_TEST',
    });

    expect(error.cause).toBe(original);
  });

  it('holds the name `YapyakError`', () => {
    const error = new YapyakError('Hello', { code: 'YPK_TEST' });

    expect(error.name).toBe('YapyakError');
  });

  it('strips the constructor frame from the stack trace', () => {
    const error = new YapyakError('Hello', { code: 'YPK_TEST' });

    expect(error.stack).not.toContain('at new YapyakError');
  });

  it('strips the subclass constructor frame from the stack trace', () => {
    class SubclassError extends YapyakError {}

    const error = new SubclassError('Hello', { code: 'YPK_TEST' });

    expect(error.stack).not.toContain('at new SubclassError');
    expect(error.stack).not.toContain('at new YapyakError');
  });

  it('returns a structured object from `toJSON()`', () => {
    const original = new Error('Save failed');
    const error = new YapyakError('Hello', {
      cause: original,
      code: 'YPK_TEST',
      meta: { requested: 'sv' },
    });

    const json = error.toJSON();

    expect(json.name).toBe('YapyakError');
    expect(json.message).toBe('Hello');
    expect(json.code).toBe('YPK_TEST');
    expect(json.meta).toEqual({ requested: 'sv' });
    expect(json.cause).toBe(original);
    expect(json.stack).toBeDefined();
  });

  it('clears undefined fields from JSON.stringify output', () => {
    const error = new YapyakError('Hello', { code: 'YPK_TEST' });

    const parsed = JSON.parse(JSON.stringify(error));

    expect(parsed.name).toBe('YapyakError');
    expect(parsed.code).toBe('YPK_TEST');
    expect(parsed.message).toBe('Hello');
    expect(parsed.meta).toBeUndefined();
    expect(parsed.cause).toBeUndefined();
  });
});
