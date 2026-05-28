import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatNumber } from './number';

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

describe('formatNumber', () => {
  it('returns a thousands-separated string for the active locale', () => {
    setLocale('en');
    expect(formatNumber(123456.78)).toBe('123,456.78');
  });

  it('returns a Swedish-grouped string when the active locale is `sv`', () => {
    setLocale('sv');
    expect(formatNumber(123456.78)).toMatch(/123.456,78/);
  });

  it('returns a truncated fraction when `maximumFractionDigits` is set', () => {
    setLocale('en');
    expect(formatNumber(123456.78, { maximumFractionDigits: 1 })).toBe(
      '123,456.8',
    );
  });

  it('returns the overridden locale when `options.locale` is set', () => {
    setLocale('en');
    expect(formatNumber(123456.78, { locale: 'sv' })).toMatch(/123.456,78/);
  });
});
