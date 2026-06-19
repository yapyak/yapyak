import { describe, expect, it } from 'vitest';

import { slugify } from './slugify';

describe('slugify', () => {
  it('transforms text to a URL-safe slug', () => {
    expect(slugify(' Hello, World! ')).toBe('hello-world');
  });

  it('returns an empty string when input is empty', () => {
    expect(slugify('')).toBe('');
  });
});
