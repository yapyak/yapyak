import { describe, expect, it } from 'vitest';

import { slugify } from './slugify';

describe('slugify', () => {
  it('transforms text to a URL-safe slug', () => {
    expect(slugify(' Hello, World! ')).toBe('hello-world');
  });

  it('returns an empty string when input is empty', () => {
    expect(slugify('')).toBe('');
  });

  it('replaces dots with dashes', () => {
    expect(slugify('vite.config.ts')).toBe('vite-config-ts');
  });

  it('strips a leading dot before the first word', () => {
    expect(slugify('.gitignore')).toBe('gitignore');
  });

  it('collapses runs of separators into a single dash', () => {
    expect(slugify('foo... bar')).toBe('foo-bar');
  });

  it('treats underscores as separators', () => {
    expect(slugify('foo_bar')).toBe('foo-bar');
  });
});
