import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  DETECT_ACCEPT_LANGUAGE: false,
  LOCALES: ['en', 'sv', 'fr'],
  PERSISTENCE_CONFIG: { type: 'none' },
  SYNC_HTML_LANG: false,
}));

const {
  autoSubscribeLocale,
  defaultLocale,
  getLocale,
  locales,
  resetLocale,
  setLocale,
  subscribeLocale,
} = await import('./store');

function makeMeta(
  hot?: { dispose(callback: () => void): void } | undefined,
): ImportMeta {
  return { ...import.meta, hot };
}

afterEach(() => {
  resetLocale();
});

describe('defaultLocale', () => {
  it('returns the configured default locale', () => {
    expect(defaultLocale).toBe('en');
  });
});

describe('getLocale', () => {
  it('returns the default locale on startup', () => {
    expect(getLocale()).toBe('en');
  });
});

describe('locales', () => {
  it('returns the configured locale list', () => {
    expect(locales).toEqual(['en', 'sv', 'fr']);
  });
});

describe('setLocale', () => {
  it('writes the current locale', () => {
    setLocale('sv');
    expect(getLocale()).toBe('sv');
  });

  it('blocks unsupported locale', () => {
    setLocale('de');
    expect(getLocale()).toBe('en');
  });
});

describe('subscribeLocale', () => {
  it('notifies subscribers with the new locale when changed', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    setLocale('sv');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('sv');
  });

  it('notifies no subscribers when set to the same locale', () => {
    const listener = vi.fn();
    subscribeLocale(listener);
    setLocale('en');
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies no subscribers after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);
    unsubscribe();
    setLocale('sv');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('autoSubscribeLocale', () => {
  it('notifies the subscriber on locale change', () => {
    const listener = vi.fn();
    autoSubscribeLocale(makeMeta(), listener);
    setLocale('sv');
    expect(listener).toHaveBeenCalledWith('sv');
  });

  it('notifies meta.hot.dispose with an unsubscribe handle', () => {
    const dispose = vi.fn();
    const listener = vi.fn();

    autoSubscribeLocale(makeMeta({ dispose }), listener);

    expect(dispose).toHaveBeenCalledOnce();
    const unsubscribe = dispose.mock.calls[0]?.[0];
    expect(unsubscribe).toBeTypeOf('function');
    unsubscribe?.();
    setLocale('sv');
    expect(listener).not.toHaveBeenCalled();
  });
});
