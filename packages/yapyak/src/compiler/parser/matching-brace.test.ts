import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

import { findMatchingBraceIndex } from './matching-brace';

describe('findMatchingBraceIndex', () => {
  it('returns the index of the matching closing brace at depth 1', () => {
    expect(findMatchingBraceIndex('{x}', 0)).toBe(2);
  });

  it('returns the index of the outer closing brace when braces are nested', () => {
    expect(findMatchingBraceIndex('{a{b}c}', 0)).toBe(6);
  });

  it('returns the source length when no closing brace is reached', () => {
    expect(findMatchingBraceIndex('{abc', 0)).toBe(4);
  });
});

describe('properties', () => {
  const braceFreeArbitrary = fc
    .string()
    .filter((s) => !s.includes('{') && !s.includes('}'));

  it.prop([
    braceFreeArbitrary,
  ])(
    'returns the position of the closing brace for every balanced `{...}` source',
    (filling) => {
      const source = `{${filling}}`;
      const result = findMatchingBraceIndex(source, 0);
      expect(result).toBe(source.length - 1);
      expect(source[result]).toBe('}');
    },
  );

  it.prop([
    braceFreeArbitrary,
  ])(
    'returns the source length when no closing brace is reached',
    (filling) => {
      const source = `{${filling}`;
      const result = findMatchingBraceIndex(source, 0);
      expect(result).toBe(source.length);
    },
  );

  it.prop([
    braceFreeArbitrary,
    braceFreeArbitrary,
    braceFreeArbitrary,
  ])(
    'returns the position of the outer closing brace for every nested `{a{b}c}` source',
    (a, b, c) => {
      const source = `{${a}{${b}}${c}}`;
      const result = findMatchingBraceIndex(source, 0);
      expect(result).toBe(source.length - 1);
      expect(source[result]).toBe('}');
    },
  );
});
