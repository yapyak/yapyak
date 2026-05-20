import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  ACCEPT_LANGUAGE: false,
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

const { i18n, resetI18n } = await import('./store');

afterEach(() => {
  resetI18n();
});

describe('i18n', () => {
  it('starts at the default locale', () => {
    expect(i18n.locale).toBe('en');
  });

  it('returns the configured locale list', () => {
    expect(i18n.locales).toEqual(['en', 'sv', 'fr']);
  });

  it('returns the configured default locale', () => {
    expect(i18n.defaultLocale).toBe('en');
  });

  it('updates locale on setLocale', () => {
    i18n.setLocale('sv');
    expect(i18n.locale).toBe('sv');
  });

  it('ignores setLocale to unsupported locale', () => {
    i18n.setLocale('de');
    expect(i18n.locale).toBe('en');
  });

  it('passes the i18n state to subscribe callbacks', () => {
    const listener = vi.fn();
    i18n.subscribe(listener);
    i18n.setLocale('sv');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(i18n);
  });

  it('does not notify subscribe when set to same locale', () => {
    const listener = vi.fn();
    i18n.subscribe(listener);
    i18n.setLocale('en');
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify after subscribe unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = i18n.subscribe(listener);
    unsubscribe();
    i18n.setLocale('sv');
    expect(listener).not.toHaveBeenCalled();
  });
});
