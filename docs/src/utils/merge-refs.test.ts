import { describe, expect, it } from 'vitest';

import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('notifies a function ref with the value when the callback runs', () => {
    let captured: string | undefined;
    const ref = (value: string | null) => {
      captured = value ?? undefined;
    };
    mergeRefs<string>(ref)('Hello');
    expect(captured).toBe('Hello');
  });

  it('writes the value to `.current` on an object ref', () => {
    const ref: {
      current: string | null;
    } = {
      current: null,
    };
    mergeRefs<string>(ref)('Hello');
    expect(ref.current).toBe('Hello');
  });

  it('walks a nested array of refs and notifies every function ref', () => {
    const captured: string[] = [];
    const first = (value: string | null) => {
      if (value !== null) {
        captured.push(value);
      }
    };
    const second = (value: string | null) => {
      if (value !== null) {
        captured.push(value);
      }
    };
    mergeRefs<string>([
      first,
      second,
    ])('Hello');
    expect(captured).toEqual([
      'Hello',
      'Hello',
    ]);
  });

  it('returns no error when a ref is `null`', () => {
    expect(() => mergeRefs<string>(null)('Hello')).not.toThrow();
  });

  it('returns no error when a ref is `undefined`', () => {
    expect(() => mergeRefs<string>(undefined)('Hello')).not.toThrow();
  });
});
