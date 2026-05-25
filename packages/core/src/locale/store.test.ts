import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

const {
  defaultLocale,
  getLocale,
  locales,
  resetLocale,
  setLocale,
  subscribeLocale,
} = await import('./store');

afterEach(() => {
  resetLocale();
});

describe('locale', () => {
  it('starts at the default locale', () => {
    expect(getLocale()).toBe('en');
  });

  it('returns the configured locale list', () => {
    expect(locales).toEqual(['en', 'sv', 'fr']);
  });

  it('returns the configured default locale', () => {
    expect(defaultLocale).toBe('en');
  });

  it('updates on setLocale', () => {
    setLocale('sv');
    expect(getLocale()).toBe('sv');
  });

  it('ignores setLocale to unsupported locale', () => {
    setLocale('de');
    expect(getLocale()).toBe('en');
  });

  it('passes the new locale to subscribe callbacks', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    setLocale('sv');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('sv');
  });

  it('does not notify when set to same locale', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    setLocale('en');
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);
    unsubscribe();
    setLocale('sv');
    expect(listener).not.toHaveBeenCalled();
  });
});
