import { describe, expect, it } from 'vitest';

import { interpolate } from './interpolate';

describe('interpolate', () => {
  it('returns the template unchanged when it has no placeholders', () => {
    expect(interpolate('Hello world', {}, 'en')).toBe('Hello world');
  });

  it('interpolates a simple placeholder with its value', () => {
    expect(interpolate('Hi {name}', { name: 'Ada' }, 'en')).toBe('Hi Ada');
  });

  it('interpolates the same placeholder everywhere it appears', () => {
    expect(interpolate('{name} and {name}', { name: 'Bo' }, 'en')).toBe(
      'Bo and Bo',
    );
  });

  it('interpolates multiple distinct placeholders', () => {
    expect(
      interpolate(
        'Hi {name}, you have {count} left',
        { count: 3, name: 'Ada' },
        'en',
      ),
    ).toBe('Hi Ada, you have 3 left');
  });

  it('returns a missing param as an empty string', () => {
    expect(interpolate('Hi {name}', {}, 'en')).toBe('Hi ');
  });

  it('transforms a numeric value to a string', () => {
    expect(interpolate('n={n}', { n: 42 }, 'en')).toBe('n=42');
  });

  describe('plural', () => {
    const template = '{count, plural, =0 {none} one {# item} other {# items}}';

    it('picks the `one` branch when count is 1', () => {
      expect(interpolate(template, { count: 1 }, 'en')).toBe('1 item');
    });

    it('picks the `other` branch when count is 5', () => {
      expect(interpolate(template, { count: 5 }, 'en')).toBe('5 items');
    });

    it('resolves an exact `=N` branch over a category branch', () => {
      expect(interpolate(template, { count: 0 }, 'en')).toBe('none');
    });

    it('interpolates `#` with locale grouping for `en`', () => {
      expect(
        interpolate('{count, plural, other {# items}}', { count: 1234 }, 'en'),
      ).toBe('1,234 items');
    });

    it('interpolates `#` with locale grouping for `sv`', () => {
      expect(
        interpolate('{count, plural, other {# items}}', { count: 1234 }, 'sv'),
      ).toMatch(/1\D234 items/);
    });

    it('resolves nested placeholders inside a branch', () => {
      expect(
        interpolate(
          '{count, plural, one {# message from {name}} other {# messages from {name}}}',
          { count: 1, name: 'Ann' },
          'en',
        ),
      ).toBe('1 message from Ann');
    });

    it('resolves a select nested inside a plural branch', () => {
      const nested =
        '{count, plural, one {{g, select, male {he} other {they}} sent #} other {{g, select, male {he} other {they}} sent #}}';
      expect(interpolate(nested, { count: 1, g: 'male' }, 'en')).toBe(
        'he sent 1',
      );
    });
  });

  describe('selectordinal', () => {
    const template =
      '{rank, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}';

    it('picks the `one` ordinal category', () => {
      expect(interpolate(template, { rank: 1 }, 'en')).toBe('1st');
    });

    it('picks the `two` ordinal category', () => {
      expect(interpolate(template, { rank: 2 }, 'en')).toBe('2nd');
    });

    it('picks the `few` ordinal category', () => {
      expect(interpolate(template, { rank: 3 }, 'en')).toBe('3rd');
    });

    it('resolves the `other` ordinal category as a fallback', () => {
      expect(interpolate(template, { rank: 11 }, 'en')).toBe('11th');
    });
  });

  describe('select', () => {
    const template = '{gender, select, male {he} female {she} other {they}}';

    it('picks the branch matching the value', () => {
      expect(interpolate(template, { gender: 'female' }, 'en')).toBe('she');
    });

    it('resolves the `other` branch for an unknown value', () => {
      expect(interpolate(template, { gender: 'nonbinary' }, 'en')).toBe('they');
    });
  });

  describe('number', () => {
    it('folds thousands with grouping for the `en` locale by default', () => {
      expect(interpolate('{n, number}', { n: 1234.5 }, 'en')).toBe('1,234.5');
    });

    it('folds thousands with grouping for the `sv` locale', () => {
      expect(interpolate('{n, number}', { n: 1234.5 }, 'sv')).toMatch(
        /1\D234,5/,
      );
    });

    it('clears the fraction for the `integer` style', () => {
      expect(interpolate('{n, number, integer}', { n: 1234.7 }, 'en')).toBe(
        '1,235',
      );
    });

    it('interpolates the `percent` style', () => {
      expect(interpolate('{p, number, percent}', { p: 0.5 }, 'en')).toBe('50%');
    });

    it('interpolates a currency with an explicit code', () => {
      expect(
        interpolate('{cost, number, currency EUR}', { cost: 1234.5 }, 'en'),
      ).toBe('€1,234.50');
    });

    it('resolves the decimal default for a currency without a code', () => {
      expect(
        interpolate('{cost, number, currency}', { cost: 1234.5 }, 'en'),
      ).toBe('1,234.5');
    });

    it('returns a missing number param as an empty string', () => {
      expect(interpolate('{n, number}', {}, 'en')).toBe('');
    });
  });

  describe('date', () => {
    const date = new Date('2020-01-02T03:04:05Z');

    it('interpolates with the `long` date style for the active locale', () => {
      const expected = new Intl.DateTimeFormat('en', {
        dateStyle: 'long',
      }).format(date);
      expect(interpolate('{d, date, long}', { d: date }, 'en')).toBe(expected);
    });

    it('interpolates with the `short` date style for the active locale', () => {
      const expected = new Intl.DateTimeFormat('en', {
        dateStyle: 'short',
      }).format(date);
      expect(interpolate('{d, date, short}', { d: date }, 'en')).toBe(expected);
    });

    it('transforms a millisecond timestamp', () => {
      const expected = new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
      }).format(date);
      expect(
        interpolate('{d, date, medium}', { d: date.getTime() }, 'en'),
      ).toBe(expected);
    });

    it('resolves the `medium` date style when none is given', () => {
      const expected = new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
      }).format(date);
      expect(interpolate('{d, date}', { d: date }, 'en')).toBe(expected);
    });

    it('returns an invalid date as an empty string', () => {
      expect(interpolate('{d, date, long}', { d: 'not-a-date' }, 'en')).toBe(
        '',
      );
    });
  });

  describe('time', () => {
    const date = new Date('2020-01-02T03:04:05Z');

    it('interpolates with the `short` time style for the active locale', () => {
      const expected = new Intl.DateTimeFormat('en', {
        timeStyle: 'short',
      }).format(date);
      expect(interpolate('{t, time, short}', { t: date }, 'en')).toBe(expected);
    });
  });
});
