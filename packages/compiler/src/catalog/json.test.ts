import { describe, expect, it } from 'vitest';

import { stringifyCanonical } from './json';

describe('stringifyCanonical', () => {
  it('produces identical output regardless of insertion order', () => {
    const first = stringifyCanonical({ a: 2, b: 1 });
    const second = stringifyCanonical({ a: 2, b: 1 });
    expect(first).toBe(second);
  });

  it('sorts keys at every nesting depth', () => {
    const value = {
      'src/one.ts': { b: '', y: '' },
      'src/two.ts': { a: '', z: '' },
    };
    expect(stringifyCanonical(value)).toBe(
      `${JSON.stringify(
        {
          'src/one.ts': { b: '', y: '' },
          'src/two.ts': { a: '', z: '' },
        },
        null,
        2,
      )}\n`,
    );
  });

  it('sorts keys case-insensitively to match Biome', () => {
    const output = stringifyCanonical({
      'Every design decision': '',
      'Every Intl primitive': '',
    });
    const designIndex = output.indexOf('design');
    const intlIndex = output.indexOf('Intl');
    expect(designIndex).toBeLessThan(intlIndex);
  });

  it('breaks case-insensitive ties with case-sensitive order', () => {
    const output = stringifyCanonical({ Apple: 1, apple: 2 });
    const upperIndex = output.indexOf('"Apple"');
    const lowerIndex = output.indexOf('"apple"');
    expect(upperIndex).toBeLessThan(lowerIndex);
  });

  it('preserves array order', () => {
    expect(stringifyCanonical([3, 1, 2])).toBe('[\n  3,\n  1,\n  2\n]\n');
  });

  it('preserves null values', () => {
    expect(stringifyCanonical({ a: null })).toBe('{\n  "a": null\n}\n');
  });

  it('terminates output with a newline', () => {
    expect(stringifyCanonical({})).toBe('{}\n');
  });
});
