import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { format } from '.';

vi.mock('@yapyak/shared', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

afterEach(() => {
  resetLocale();
});

describe('format', () => {
  describe('number', () => {
    it('groups thousands for the active locale', () => {
      setLocale('en');
      expect(format.number(123456.78)).toBe('123,456.78');
    });

    it('truncates to `maximumFractionDigits`', () => {
      setLocale('en');
      expect(format.number(123456.78, { maximumFractionDigits: 1 })).toBe(
        '123,456.8',
      );
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
  });

  describe('percent', () => {
    it('renders a fraction as a percentage', () => {
      setLocale('en');
      expect(format.percent(0.42)).toBe('42%');
    });
  });

  describe('list', () => {
    it('joins items with a locale-aware conjunction', () => {
      setLocale('en');
      expect(format.list(['a', 'b', 'c'])).toBe('a, b, and c');
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
    it('formats a date for the active locale', () => {
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
    it('scopes formatting to a fixed locale regardless of the active locale', () => {
      setLocale('en');
      expect(format.in('sv').number(123456.78)).toMatch(/123.456,78/);
    });

    it('returns a reusable formatter', () => {
      setLocale('en');
      const sv = format.in('sv');
      expect(sv.number(1000)).toMatch(/1.000/);
      expect(sv.currency(200, 'SEK')).toMatch(/200/);
    });

    it('honors the last locale when chained', () => {
      setLocale('en');
      expect(format.in('sv').in('en').number(1000)).toBe('1,000');
    });
  });
});
