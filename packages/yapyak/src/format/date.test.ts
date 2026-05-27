import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatDate } from './date';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

const SAMPLE = new Date('2026-05-25T12:00:00Z');

afterEach(() => {
  resetLocale();
});

describe('formatDate', () => {
  it('returns a medium-style date when called without options', () => {
    setLocale('en');
    expect(formatDate(SAMPLE)).toMatch(/May 25, 2026|Apr|Jun/);
  });

  it('returns a long-style date when `dateStyle` is `long`', () => {
    setLocale('en');
    expect(formatDate(SAMPLE, { dateStyle: 'long' })).toContain('2026');
  });

  it('returns the overridden locale when `options.locale` is set', () => {
    setLocale('en');
    expect(formatDate(SAMPLE, { dateStyle: 'long', locale: 'sv' })).toContain(
      '2026',
    );
  });
});
