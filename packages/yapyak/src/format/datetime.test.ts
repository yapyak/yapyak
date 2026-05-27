import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetLocale, setLocale } from '../locale';
import { formatDateTime } from './datetime';

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

describe('formatDateTime', () => {
  it('returns a combined date and time string when called without options', () => {
    setLocale('en');
    const out = formatDateTime(SAMPLE);
    expect(out).toContain('2026');
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it('returns a long-style date and short-style time when overridden', () => {
    setLocale('en');
    const out = formatDateTime(SAMPLE, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    expect(out).toContain('2026');
  });
});
