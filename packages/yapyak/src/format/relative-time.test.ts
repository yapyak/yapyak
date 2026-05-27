import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatRelativeTime } from './relative-time';

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

describe('formatRelativeTime', () => {
  it('returns a past phrase when the value is negative', () => {
    setLocale('en');
    expect(formatRelativeTime(-2, 'day')).toBe('2 days ago');
  });

  it('returns a future phrase when the value is positive', () => {
    setLocale('en');
    expect(formatRelativeTime(3, 'hour')).toBe('in 3 hours');
  });

  it('returns the overridden locale when `options.locale` is set', () => {
    setLocale('en');
    expect(formatRelativeTime(-2, 'day', { locale: 'sv' })).toMatch(/2/);
  });
});
