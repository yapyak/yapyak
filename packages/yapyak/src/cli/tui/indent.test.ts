import { describe, expect, it } from 'vitest';

import { indent } from './indent';

describe('indent', () => {
  it('returns the text with `2` spaces in front by default', () => {
    expect(indent('Hello')).toBe('  Hello');
  });

  it('returns the text with `n` spaces in front when configured', () => {
    expect(indent('Hello', 4)).toBe('    Hello');
  });

  it('returns every line of a multi-line string with the indent prefix', () => {
    expect(indent('Hello\nWorld')).toBe('  Hello\n  World');
  });
});
