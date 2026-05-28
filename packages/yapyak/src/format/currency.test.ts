import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatCurrency } from './currency';

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

describe('formatCurrency', () => {
  it('returns a SEK-formatted string when the active locale is `sv`', () => {
    setLocale('sv');
    expect(formatCurrency(499, 'SEK')).toMatch(/499/);
  });

  it('returns a EUR-formatted string when the currency is `EUR`', () => {
    setLocale('en');
    expect(formatCurrency(499, 'EUR')).toContain('€');
  });

  it('returns a narrow symbol when `currencyDisplay` is `narrowSymbol`', () => {
    setLocale('en');
    expect(
      formatCurrency(499, 'EUR', { currencyDisplay: 'narrowSymbol' }),
    ).toContain('€');
  });
});
