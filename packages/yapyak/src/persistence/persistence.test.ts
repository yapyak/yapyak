import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPersistence } from './index.ts';

const COOKIE_NAME = 'locale';
const STORAGE_KEY = 'locale';

describe('createPersistence', () => {
  it('returns null when config is null', () => {
    expect(createPersistence(null)).toBeNull();
  });
});

describe('cookie persistence', () => {
  let cookieJar = '';

  beforeEach(() => {
    cookieJar = '';
    vi.stubGlobal('document', {
      get cookie() {
        return cookieJar;
      },
      set cookie(value: string) {
        const [pair] = value.split(';');
        if (!pair) return;
        const [name, val = ''] = pair.split('=');
        const trimmedName = name?.trim();
        if (!trimmedName) return;
        const existing = cookieJar
          .split(';')
          .map((p) => p.trim())
          .filter((p) => p && !p.startsWith(`${trimmedName}=`));
        existing.push(`${trimmedName}=${val.trim()}`);
        cookieJar = existing.join('; ');
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads value from document.cookie', () => {
    cookieJar = `${COOKIE_NAME}=sv`;
    const persistence = createPersistence({
      name: COOKIE_NAME,
      type: 'cookie',
    });
    expect(persistence?.get()).toBe('sv');
  });

  it('returns undefined when cookie is missing', () => {
    cookieJar = 'theme=dark';
    const persistence = createPersistence({
      name: COOKIE_NAME,
      type: 'cookie',
    });
    expect(persistence?.get()).toBeUndefined();
  });

  it('returns undefined when cookie is empty string', () => {
    cookieJar = `${COOKIE_NAME}=`;
    const persistence = createPersistence({
      name: COOKIE_NAME,
      type: 'cookie',
    });
    expect(persistence?.get()).toBeUndefined();
  });

  it('writes to document.cookie on save', () => {
    const persistence = createPersistence({
      name: COOKIE_NAME,
      type: 'cookie',
    });
    persistence?.set('fr');
    expect(cookieJar).toContain(`${COOKIE_NAME}=fr`);
  });

  it('uses configured cookie name', () => {
    const persistence = createPersistence({
      name: 'app-locale',
      type: 'cookie',
    });
    persistence?.set('de');
    expect(cookieJar).toContain('app-locale=de');
  });
});

describe('localStorage persistence', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      removeItem(key: string) {
        storage.delete(key);
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads value from localStorage', () => {
    storage.set(STORAGE_KEY, 'sv');
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    expect(persistence?.get()).toBe('sv');
  });

  it('returns undefined when key is missing', () => {
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    expect(persistence?.get()).toBeUndefined();
  });

  it('writes to localStorage on save', () => {
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    persistence?.set('fr');
    expect(storage.get(STORAGE_KEY)).toBe('fr');
  });

  it('uses configured storage key', () => {
    const persistence = createPersistence({
      key: 'custom-key',
      type: 'localStorage',
    });
    persistence?.set('de');
    expect(storage.get('custom-key')).toBe('de');
  });

  it('swallows getItem errors', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {},
    });
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    expect(persistence?.get()).toBeUndefined();
  });

  it('swallows setItem errors', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('quota');
      },
    });
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    expect(() => persistence?.set('de')).not.toThrow();
  });
});

describe('persistence in non-browser environments', () => {
  it('cookie persistence load returns undefined when document is missing', () => {
    const persistence = createPersistence({
      name: COOKIE_NAME,
      type: 'cookie',
    });
    expect(persistence?.get()).toBeUndefined();
  });

  it('cookie persistence save is a no-op when document is missing', () => {
    const persistence = createPersistence({
      name: COOKIE_NAME,
      type: 'cookie',
    });
    expect(() => persistence?.set('sv')).not.toThrow();
  });

  it('localStorage persistence load returns undefined when storage is missing', () => {
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    expect(persistence?.get()).toBeUndefined();
  });

  it('localStorage persistence save is a no-op when storage is missing', () => {
    const persistence = createPersistence({
      key: STORAGE_KEY,
      type: 'localStorage',
    });
    expect(() => persistence?.set('sv')).not.toThrow();
  });
});
