import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { buildPersistence, createPersistence } from '.';

const LOCALES = ['en', 'sv', 'fr'] as const;

describe('createPersistence', () => {
  it('coerces undefined return from set to false', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => undefined,
    });
    expect(persistence.set('sv')).toBe(false);
  });

  it('preserves true return from set', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => true,
    });
    expect(persistence.set('sv')).toBe(true);
  });

  it('coerces false return from set to false', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => false,
    });
    expect(persistence.set('sv')).toBe(false);
  });

  it('omits getFromRequest when not provided', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => undefined,
    });
    expect(persistence.getFromRequest).toBeUndefined();
  });
});

describe('buildPersistence', () => {
  it('returns null when config is null', () => {
    expect(buildPersistence(null, LOCALES)).toBeNull();
  });

  it('builds cookie persistence', () => {
    const persistence = buildPersistence(
      { name: 'locale', type: 'cookie' },
      LOCALES,
    );
    expect(persistence).not.toBeNull();
    expect(persistence?.getFromRequest).toBeDefined();
  });

  it('builds localStorage persistence', () => {
    const persistence = buildPersistence(
      { key: 'locale', type: 'localStorage' },
      LOCALES,
    );
    expect(persistence).not.toBeNull();
    expect(persistence?.getFromRequest).toBeUndefined();
  });

  it('builds url persistence with default pattern', () => {
    const persistence = buildPersistence({ type: 'url' }, LOCALES);
    expect(persistence).not.toBeNull();
    expect(persistence?.getFromRequest).toBeDefined();
  });

  it('builds url persistence with custom regex from source/flags', () => {
    const persistence = buildPersistence(
      { match: { flags: '', source: '/(en|sv)/' }, type: 'url' },
      LOCALES,
    );
    expect(persistence).not.toBeNull();
  });
});

describe('cookie() factory', () => {
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
    cookieJar = 'locale=sv';
    expect(cookie({ name: 'locale' }).get()).toBe('sv');
  });

  it('returns undefined when cookie is missing', () => {
    cookieJar = 'theme=dark';
    expect(cookie({ name: 'locale' }).get()).toBeUndefined();
  });

  it('returns undefined when cookie is empty string', () => {
    cookieJar = 'locale=';
    expect(cookie({ name: 'locale' }).get()).toBeUndefined();
  });

  it('writes to document.cookie on set', () => {
    cookie({ name: 'locale' }).set('fr');
    expect(cookieJar).toContain('locale=fr');
  });

  it('uses configured cookie name', () => {
    cookie({ name: 'app-locale' }).set('de');
    expect(cookieJar).toContain('app-locale=de');
  });

  it('returns false from set (does not navigate)', () => {
    expect(cookie({ name: 'locale' }).set('sv')).toBe(false);
  });

  it('reads from request cookie header via getFromRequest', () => {
    const request = new Request('http://example.test', {
      headers: { cookie: 'locale=sv; theme=dark' },
    });
    expect(cookie({ name: 'locale' }).getFromRequest?.(request)).toBe('sv');
  });

  it('returns undefined from getFromRequest when cookie header is missing', () => {
    const request = new Request('http://example.test');
    expect(
      cookie({ name: 'locale' }).getFromRequest?.(request),
    ).toBeUndefined();
  });
});

describe('localStorage() factory', () => {
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
    storage.set('locale', 'sv');
    expect(localStorage({ key: 'locale' }).get()).toBe('sv');
  });

  it('returns undefined when key is missing', () => {
    expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
  });

  it('writes to localStorage on set', () => {
    localStorage({ key: 'locale' }).set('fr');
    expect(storage.get('locale')).toBe('fr');
  });

  it('uses configured storage key', () => {
    localStorage({ key: 'custom-key' }).set('de');
    expect(storage.get('custom-key')).toBe('de');
  });

  it('returns false from set (does not navigate)', () => {
    expect(localStorage({ key: 'locale' }).set('sv')).toBe(false);
  });

  it('swallows getItem errors', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {},
    });
    expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
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
    expect(() => localStorage({ key: 'locale' }).set('de')).not.toThrow();
  });

  it('has no getFromRequest implementation', () => {
    expect(localStorage({ key: 'locale' }).getFromRequest).toBeUndefined();
  });
});

describe('persistence in non-browser environments', () => {
  it('cookie get returns undefined when document is missing', () => {
    expect(cookie({ name: 'locale' }).get()).toBeUndefined();
  });

  it('cookie set is a no-op when document is missing', () => {
    expect(() => cookie({ name: 'locale' }).set('sv')).not.toThrow();
  });

  it('localStorage get returns undefined when storage is missing', () => {
    expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
  });

  it('localStorage set is a no-op when storage is missing', () => {
    expect(() => localStorage({ key: 'locale' }).set('sv')).not.toThrow();
  });
});
