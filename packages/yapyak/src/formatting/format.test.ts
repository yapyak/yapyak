import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { resetWarn, setWarn } from '../warn';
import { format } from './format';

beforeEach(() => {
  vi.stubGlobal('window', {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetLocale();
  resetWarn();
});

describe('format', () => {
  describe('number', () => {
    describe('decimal', () => {
      it('folds thousands with grouping for the active locale', () => {
        setLocale('en');
        expect(format.number(123_456.78)).toBe('123,456.78');
      });

      it('transforms to `maximumFractionDigits`', () => {
        setLocale('en');
        expect(
          format.number(123_456.78, {
            maximumFractionDigits: 1,
          }),
        ).toBe('123,456.8');
      });

      it('returns `NaN` for `Number.NaN`', () => {
        setLocale('en');
        expect(format.number(Number.NaN)).toBe('NaN');
      });

      it('returns `∞` for `Number.POSITIVE_INFINITY`', () => {
        setLocale('en');
        expect(format.number(Number.POSITIVE_INFINITY)).toBe('∞');
      });
    });

    describe('currency', () => {
      it('returns the currency symbol', () => {
        setLocale('en');
        expect(
          format.number(499, {
            currency: 'EUR',
            style: 'currency',
          }),
        ).toContain('€');
      });

      it('returns a narrow symbol when `currencyDisplay` is `narrowSymbol`', () => {
        setLocale('en');
        expect(
          format.number(499, {
            currency: 'EUR',
            currencyDisplay: 'narrowSymbol',
            style: 'currency',
          }),
        ).toContain('€');
      });

      describe('unsupported codes', () => {
        let warnSpy: ReturnType<
          typeof vi.fn<
            (message: string, meta?: Record<string, unknown>) => void
          >
        >;

        beforeEach(() => {
          warnSpy =
            vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
          setWarn(warnSpy);
        });

        it('returns a `<value> <code>` fallback for an unknown ISO 4217 code', () => {
          setLocale('en');
          expect(
            format.number(499, {
              currency: 'XYZ',
              style: 'currency',
            }),
          ).toBe('499 XYZ');
        });

        it('returns a `<value> <code>` fallback for a code that is not three letters', () => {
          setLocale('en');
          expect(
            format.number(10, {
              currency: 'USDD',
              style: 'currency',
            }),
          ).toBe('10 USDD');
        });

        it('returns a `<value> <code>` fallback for an empty code', () => {
          setLocale('en');
          expect(
            format.number(10, {
              currency: '',
              style: 'currency',
            }),
          ).toBe('10 ');
        });

        it('warns the consumer once per locale-and-code pair', () => {
          setLocale('en');
          format.number(1, {
            currency: 'AAA',
            style: 'currency',
          });
          format.number(2, {
            currency: 'AAA',
            style: 'currency',
          });
          format.number(3, {
            currency: 'AAA',
            style: 'currency',
          });
          const currencyWarns = warnSpy.mock.calls.filter(([message]) =>
            message.includes('Unsupported currency code "AAA"'),
          );
          expect(currencyWarns).toHaveLength(1);
        });

        it('folds the value with the active locale before appending the code', () => {
          setLocale('sv');
          expect(
            format.number(1234.5, {
              currency: 'XYZ',
              style: 'currency',
            }),
          ).toMatch(/^1\D234,5 XYZ$/);
        });
      });
    });

    describe('percent', () => {
      it('returns a fraction as a percentage', () => {
        setLocale('en');
        expect(
          format.number(0.42, {
            style: 'percent',
          }),
        ).toBe('42%');
      });

      it('returns a negative percentage for a negative fraction', () => {
        setLocale('en');
        expect(
          format.number(-0.5, {
            style: 'percent',
          }),
        ).toBe('-50%');
      });
    });
  });

  describe('list', () => {
    it('transforms items with a locale-aware conjunction', () => {
      setLocale('en');
      expect(
        format.list([
          'a',
          'b',
          'c',
        ]),
      ).toBe('a, b, and c');
    });

    it('returns an empty string for an empty iterable', () => {
      setLocale('en');
      expect(format.list([])).toBe('');
    });

    it('returns the single item unchanged for a singleton iterable', () => {
      setLocale('en');
      expect(
        format.list([
          'Hello',
        ]),
      ).toBe('Hello');
    });
  });

  describe('dateTime', () => {
    it('returns a formatted date and time for the active locale', () => {
      setLocale('en');
      expect(
        format.dateTime(new Date('2026-01-15T12:00:00Z'), {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC',
        }),
      ).toContain('2026');
    });

    it('falls through to the host `Intl` default when no options are supplied', () => {
      setLocale('en');
      const formatted = format.dateTime(new Date('2026-01-15T12:00:00Z'));
      expect(formatted).toMatch(/2026/);
    });

    it('returns a formatted time-of-day with `timeStyle` only', () => {
      setLocale('en');
      expect(
        format.dateTime(new Date('2026-01-15T12:30:00Z'), {
          timeStyle: 'short',
          timeZone: 'UTC',
        }),
      ).toMatch(/12:30/);
    });

    it('returns a formatted date with `dateStyle` only', () => {
      setLocale('en');
      expect(
        format.dateTime(new Date('2026-01-15T12:00:00Z'), {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }),
      ).toContain('2026');
    });
  });

  describe('relativeTime', () => {
    it('returns a past offset for a negative value', () => {
      setLocale('en');
      expect(format.relativeTime(-2, 'day')).toBe('2 days ago');
    });

    it('returns a future offset for a positive value', () => {
      setLocale('en');
      expect(format.relativeTime(3, 'hour')).toBe('in 3 hours');
    });
  });

  describe('in', () => {
    it('returns a formatted value for the scoped locale regardless of the active locale', () => {
      setLocale('en');
      expect(format.in('sv').number(123_456.78)).toMatch(/123\D456,78/);
    });

    it('returns a reusable formatter', () => {
      setLocale('en');
      const sv = format.in('sv');
      expect(sv.number(1000)).toMatch(/1\D000/);
      expect(
        sv.number(200, {
          currency: 'SEK',
          style: 'currency',
        }),
      ).toMatch(/200/);
    });

    it('preserves the last locale when chained', () => {
      setLocale('en');
      expect(format.in('sv').in('en').number(1000)).toBe('1,000');
    });
  });
});
