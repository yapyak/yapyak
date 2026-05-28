import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatTime } from './time';

vi.mock('@yapyak/shared', () => ({
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

describe('formatTime', () => {
  it('returns a short-style time when called without options', () => {
    setLocale('en');
    expect(formatTime(SAMPLE)).toMatch(/\d{1,2}:\d{2}/);
  });

  it('returns a long-style time when `timeStyle` is `long`', () => {
    setLocale('en');
    expect(formatTime(SAMPLE, { timeStyle: 'long' })).toMatch(/\d{1,2}:\d{2}/);
  });
});
