import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureLocale,
  createLocaleStore,
  getLocale,
  getLocaleStore,
  resetLocaleStore,
  setLocale,
} from './store.js';

afterEach(() => {
  resetLocaleStore();
});

describe('createLocaleStore', () => {
  it('starts at defaultLocale when no initial provided', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    expect(store.get()).toBe('en');
  });

  it('uses initialLocale when configured and supported', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      initialLocale: 'sv',
      locales: ['en', 'sv'],
    });
    expect(store.get()).toBe('sv');
  });

  it('falls back to defaultLocale when initialLocale is unsupported', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      initialLocale: 'de',
      locales: ['en', 'sv'],
    });
    expect(store.get()).toBe('en');
  });

  it('updates locale on set()', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    store.set('sv');
    expect(store.get()).toBe('sv');
  });

  it('ignores set() to unsupported locale', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    store.set('de');
    expect(store.get()).toBe('en');
  });

  it('notifies subscribers on change', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set('sv');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when set to same locale', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set('en');
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify after unsubscribe', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set('sv');
    expect(listener).not.toHaveBeenCalled();
  });

  it('produces a new snapshot on each change', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    const before = store.getSnapshot();
    store.set('sv');
    const after = store.getSnapshot();
    expect(before).not.toBe(after);
  });

  it('produces a stable snapshot when nothing changes', () => {
    const store = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });
});

describe('global store', () => {
  it('configureLocale returns a fresh store', () => {
    const store = configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    expect(store.get()).toBe('en');
  });

  it('getLocale reads from configured store', () => {
    configureLocale({
      defaultLocale: 'sv',
      locales: ['en', 'sv'],
    });
    expect(getLocale()).toBe('sv');
  });

  it('setLocale writes to configured store', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv', 'fr'],
    });
    setLocale('fr');
    expect(getLocale()).toBe('fr');
  });

  it('auto-initializes with defaults when not configured', () => {
    expect(getLocale()).toBe('en');
  });

  it('configureLocale replaces previous store', () => {
    configureLocale({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
    });
    setLocale('sv');
    configureLocale({
      defaultLocale: 'fr',
      locales: ['en', 'sv', 'fr'],
    });
    expect(getLocale()).toBe('fr');
  });

  it('getLocaleStore returns the same instance across calls', () => {
    const a = getLocaleStore();
    const b = getLocaleStore();
    expect(a).toBe(b);
  });
});
