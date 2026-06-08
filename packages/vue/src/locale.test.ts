import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv'],
  PERSISTENCE_CONFIG: { type: 'none' },
  SYNC_HTML_LANG: false,
}));

const { getLocale, setLocale } = await import('yapyak');
const { locale } = await import('./locale');

afterEach(() => {
  setLocale('en');
});

describe('locale', () => {
  it('returns the current locale on `value` read', () => {
    setLocale('sv');
    expect(locale.value).toBe('sv');
  });

  it('writes the new locale on `value` write', () => {
    locale.value = 'sv';
    expect(getLocale()).toBe('sv');
  });
});
