import { describe, expect, it } from 'vitest';

import { stringifyCanonical } from './canonical';

describe('stringifyCanonical', () => {
  it('returns identical output regardless of insertion order', () => {
    const first = stringifyCanonical({
      a: 2,
      b: 1,
    });
    const second = stringifyCanonical({
      a: 2,
      b: 1,
    });
    expect(first).toBe(second);
  });

  it('transforms keys into sorted order at every nesting depth', () => {
    const value = {
      'src/a.ts': {
        b: '',
        y: '',
      },
      'src/b.ts': {
        a: '',
        z: '',
      },
    };
    expect(stringifyCanonical(value)).toBe(
      `${JSON.stringify(
        {
          'src/a.ts': {
            b: '',
            y: '',
          },
          'src/b.ts': {
            a: '',
            z: '',
          },
        },
        null,
        2,
      )}\n`,
    );
  });

  it('transforms keys case-insensitively to match Biome order', () => {
    const output = stringifyCanonical({
      'Every Intl primitive': '',
      'Every design decision': '',
    });
    const designIndex = output.indexOf('design');
    const intlIndex = output.indexOf('Intl');
    expect(designIndex).toBeLessThan(intlIndex);
  });

  it('transforms case-insensitive ties using case-sensitive order', () => {
    const output = stringifyCanonical({
      Apple: 1,
      apple: 2,
    });
    const upperIndex = output.indexOf('"Apple"');
    const lowerIndex = output.indexOf('"apple"');
    expect(upperIndex).toBeLessThan(lowerIndex);
  });

  it('transforms context keys into sorted order', () => {
    const output = stringifyCanonical({
      'src/a.tsx': {
        Save: {
          button: 'Spara',
          toolbar: 'Spara',
        },
      },
    });
    expect(output.indexOf('button')).toBeLessThan(output.indexOf('toolbar'));
  });

  it('preserves array order', () => {
    expect(
      stringifyCanonical([
        3,
        1,
        2,
      ]),
    ).toBe('[\n  3,\n  1,\n  2\n]\n');
  });

  it('preserves `null` values', () => {
    expect(
      stringifyCanonical({
        a: null,
      }),
    ).toBe('{\n  "a": null\n}\n');
  });

  it('writes a trailing newline', () => {
    expect(stringifyCanonical({})).toBe('{}\n');
  });
});
