import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('virtual:yapyak', () => ({
  ACCEPT_LANGUAGE: false,
  DEFAULT_LOCALE: 'en',
  LOADERS: {
    fr: () => Promise.resolve({ default: {} }),
    sv: () => Promise.resolve({ default: {} }),
  },
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE: null,
  SYNC_HTML_LANG: false,
}));

const {
  getDefaultLocale,
  getLocale,
  getLocales,
  getLocaleSnapshot,
  resetLocaleStore,
  setLocale,
  subscribeLocale,
} = await import('./store');

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

  it('updates locale on setLocale', async () => {
    await setLocale('sv');
    expect(getLocale()).toBe('sv');
  });

  it('ignores setLocale to unsupported locale', async () => {
    await setLocale('de');
    expect(getLocale()).toBe('en');
  });

  it('notifies subscribers on change', async () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    await setLocale('sv');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when set to same locale', async () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    await setLocale('en');
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify after unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);
    unsubscribe();
    await setLocale('sv');
    expect(listener).not.toHaveBeenCalled();
  });

  it('produces a new snapshot on each change', async () => {
    const before = getLocaleSnapshot();
    await setLocale('sv');
    const after = getLocaleSnapshot();
    expect(before).not.toBe(after);
  });

  it('produces a stable snapshot when nothing changes', () => {
    expect(getLocaleSnapshot()).toBe(getLocaleSnapshot());
  });
});
