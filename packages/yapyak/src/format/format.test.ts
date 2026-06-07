import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { format } from './format';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE_CONFIG: { type: 'none' },
  SYNC_HTML_LANG: false,
}));

afterEach(() => {
  resetLocale();
});

describe('format', () => {
  describe('number', () => {
    it('folds thousands with grouping for the active locale', () => {
      setLocale('en');
      expect(format.number(123456.78)).toBe('123,456.78');
    });

    it('transforms to `maximumFractionDigits`', () => {
      setLocale('en');
      expect(format.number(123456.78, { maximumFractionDigits: 1 })).toBe(
        '123,456.8',
      );
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
    it('renders the currency symbol', () => {
      setLocale('en');
      expect(format.currency(499, 'EUR')).toContain('€');
    });

    it('renders a narrow symbol when `currencyDisplay` is `narrowSymbol`', () => {
      setLocale('en');
      expect(
        format.currency(499, 'EUR', { currencyDisplay: 'narrowSymbol' }),
      ).toContain('€');
    });

    it('throws for an empty currency code', () => {
      setLocale('en');
      expect(() => format.currency(10, '')).toThrow(/Invalid currency code/);
    });

    it('throws for a currency code that is not three letters', () => {
      setLocale('en');
      expect(() => format.currency(10, 'USDD')).toThrow(
        /Invalid currency code/,
      );
    });
  });

  describe('percent', () => {
    it('renders a fraction as a percentage', () => {
      setLocale('en');
      expect(format.percent(0.42)).toBe('42%');
    });

    it('returns a negative percentage for a negative fraction', () => {
      setLocale('en');
      expect(format.percent(-0.5)).toBe('-50%');
    });
  });

  describe('list', () => {
    it('transforms items with a locale-aware conjunction', () => {
      setLocale('en');
      expect(format.list(['a', 'b', 'c'])).toBe('a, b, and c');
    });

    it('returns an empty string for an empty iterable', () => {
      setLocale('en');
      expect(format.list([])).toBe('');
    });

    it('returns the single item unchanged for a singleton iterable', () => {
      setLocale('en');
      expect(format.list(['Hello'])).toBe('Hello');
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
  });

  describe('time', () => {
    it('returns a formatted time-of-day for the active locale', () => {
      setLocale('en');
      expect(
        format.time(new Date('2026-01-15T12:30:00Z'), {
          timeStyle: 'short',
          timeZone: 'UTC',
        }),
      ).toMatch(/12:30/);
    });
  });

  describe('relativeTime', () => {
    it('renders a past offset for a negative value', () => {
      setLocale('en');
      expect(format.relativeTime(-2, 'day')).toBe('2 days ago');
    });

    it('renders a future offset for a positive value', () => {
      setLocale('en');
      expect(format.relativeTime(3, 'hour')).toBe('in 3 hours');
    });
  });

  describe('date', () => {
    it('returns a formatted date for the active locale', () => {
      setLocale('en');
      expect(
        format.date(new Date('2026-01-15T12:00:00Z'), {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }),
      ).toContain('2026');
    });
  });

  describe('in', () => {
    it('returns a formatted value for the scoped locale regardless of the active locale', () => {
      setLocale('en');
      expect(format.in('sv').number(123456.78)).toMatch(/123\D456,78/);
    });

    it('returns a reusable formatter', () => {
      setLocale('en');
      const sv = format.in('sv');
      expect(sv.number(1000)).toMatch(/1\D000/);
      expect(sv.currency(200, 'SEK')).toMatch(/200/);
    });

    it('preserves the last locale when chained', () => {
      setLocale('en');
      expect(format.in('sv').in('en').number(1000)).toBe('1,000');
    });
  });
});
