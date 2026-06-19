import { describe, expect, it } from 'vitest';

import { mergeClassNames } from './merge-class-names';

describe('mergeClassNames', () => {
  it('folds two truthy classes into a space-joined string', () => {
    expect(mergeClassNames('Hello', 'World')).toBe('Hello World');
  });

  it('folds a nested array of classes', () => {
    expect(
      mergeClassNames([
        'Hello',
        [
          'World',
        ],
      ]),
    ).toBe('Hello World');
  });

  it('returns the stringified form of a truthy number', () => {
    expect(mergeClassNames(42)).toBe('42');
  });

  it('returns `"true"` for a boolean `true` argument', () => {
    expect(mergeClassNames(true)).toBe('true');
  });

  it('returns `undefined` when no class is truthy', () => {
    expect(mergeClassNames(null, undefined, false, '', 0)).toBeUndefined();
  });

  it('returns `undefined` when no argument is provided', () => {
    expect(mergeClassNames()).toBeUndefined();
  });
});
