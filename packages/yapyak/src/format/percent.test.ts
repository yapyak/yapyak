import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatPercent } from './percent';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

afterEach(() => {
  resetLocale();
});

describe('formatPercent', () => {
  it('returns the fraction as a percent string for the active locale', () => {
    setLocale('en');
    expect(formatPercent(0.42)).toBe('42%');
  });

  it('returns the overridden locale when `options.locale` is set', () => {
    setLocale('en');
    expect(formatPercent(0.42, { locale: 'sv' })).toMatch(/42\s?%/);
  });
});
