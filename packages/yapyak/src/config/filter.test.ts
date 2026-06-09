import { describe, expect, it } from 'vitest';

import { createFilter } from './filter';

describe('createFilter', () => {
  it('returns true for a path matched by a single glob include', () => {
    const filter = createFilter('src/**/*.ts', []);
    expect(filter('src/a.ts')).toBe(true);
  });

  it('returns false for a path matched by exclude', () => {
    const filter = createFilter('src/**/*.ts', '**/*.test.ts');
    expect(filter('src/a.test.ts')).toBe(false);
  });

  it('returns true for a path matched by a RegExp include', () => {
    const filter = createFilter(/\.svelte$/, []);
    expect(filter('src/App.svelte')).toBe(true);
  });

  it('returns true for a path matched by any include in an array', () => {
    const filter = createFilter(['src/**/*.ts', 'app/**/*.ts'], []);
    expect(filter('app/main.ts')).toBe(true);
  });

  it('returns false for a path not matched by any include', () => {
    const filter = createFilter('src/**/*.ts', []);
    expect(filter('docs/readme.md')).toBe(false);
  });

  it('throws when include is an empty array', () => {
    expect(() => createFilter([], [])).toThrow(
      /include cannot be an empty array/,
    );
  });
});
