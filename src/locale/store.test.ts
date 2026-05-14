import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  LOCALES: ['en', 'sv', 'fr'],
  DEFAULT_LOCALE: 'en',
  COOKIE_NAME: 'locale',
  PERSISTENCE: null,
  ACCEPT_LANGUAGE: false,
  STORAGE_KEY: 'yapyak:locale',
}));

const {
  getDefaultLocale,
  getLocale,
  getLocales,
  getLocaleSnapshot,
  resetLocaleStore,
  setLocale,
  subscribeLocale,
} = await import('./store.js');

afterEach(() => {
  resetLocaleStore();
});

describe('locale store', () => {
  it('starts at the default locale', () => {
    expect(getLocale()).toBe('en');
  });

  it('returns the configured locale list', () => {
    expect(getLocales()).toEqual(['en', 'sv', 'fr']);
  });

  it('returns the configured default locale', () => {
    expect(getDefaultLocale()).toBe('en');
  });

  it('updates locale on setLocale', () => {
    setLocale('sv');
    expect(getLocale()).toBe('sv');
  });

  it('ignores setLocale to unsupported locale', () => {
    setLocale('de');
    expect(getLocale()).toBe('en');
  });

  it('notifies subscribers on change', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    setLocale('sv');
    expect(listener).toHaveBeenCalledTimes(1);
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

  it('produces a new snapshot on each change', () => {
    const before = getLocaleSnapshot();
    setLocale('sv');
    const after = getLocaleSnapshot();
    expect(before).not.toBe(after);
  });

  it('produces a stable snapshot when nothing changes', () => {
    expect(getLocaleSnapshot()).toBe(getLocaleSnapshot());
  });
});
