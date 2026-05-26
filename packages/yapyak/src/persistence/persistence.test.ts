import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { buildPersistence, createPersistence } from '.';

const LOCALES = ['en', 'sv', 'fr'] as const;

describe('buildPersistence', () => {
  it('builds `cookie` persistence', () => {
    const persistence = buildPersistence(
      { name: 'locale', type: 'cookie' },
      LOCALES,
    );
    expect(persistence).not.toBeNull();
    expect(persistence?.getFromRequest).toBeDefined();
  });

  it('builds `localStorage` persistence', () => {
    const persistence = buildPersistence(
      { key: 'locale', type: 'localStorage' },
      LOCALES,
    );
    expect(persistence).not.toBeNull();
    expect(persistence?.getFromRequest).toBeUndefined();
  });

  it('builds `url` persistence with default pattern', () => {
    const persistence = buildPersistence({ type: 'url' }, LOCALES);
    expect(persistence).not.toBeNull();
    expect(persistence?.getFromRequest).toBeDefined();
  });

  it('builds `url` persistence with a custom `RegExp`', () => {
    const persistence = buildPersistence(
      { match: /\/(en|sv)\//, type: 'url' },
      LOCALES,
    );
    expect(persistence).not.toBeNull();
  });

  it('returns `null` when config is `null`', () => {
    expect(buildPersistence(null, LOCALES)).toBeNull();
  });
});

describe('cookie', () => {
  describe('in browser', () => {
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

    it('returns the cookie value from `document.cookie`', () => {
      cookieJar = 'locale=sv';
      expect(cookie({ name: 'locale' }).get()).toBe('sv');
    });

    it('writes to `document.cookie` on set', () => {
      cookie({ name: 'locale' }).set('fr');
      expect(cookieJar).toContain('locale=fr');
    });

    it('writes under the configured cookie name', () => {
      cookie({ name: 'app-locale' }).set('de');
      expect(cookieJar).toContain('app-locale=de');
    });

    it('returns `false` from set', () => {
      expect(cookie({ name: 'locale' }).set('sv')).toBe(false);
    });

    it('returns the cookie value from the request `cookie` header', () => {
      const request = new Request('http://example.test', {
        headers: { cookie: 'locale=sv; theme=dark' },
      });
      expect(cookie({ name: 'locale' }).getFromRequest?.(request)).toBe('sv');
    });

    it('returns `undefined` when cookie is missing', () => {
      cookieJar = 'theme=dark';
      expect(cookie({ name: 'locale' }).get()).toBeUndefined();
    });

    it('returns `undefined` when cookie is an empty string', () => {
      cookieJar = 'locale=';
      expect(cookie({ name: 'locale' }).get()).toBeUndefined();
    });

    it('returns `undefined` from `getFromRequest` when `cookie` header is missing', () => {
      const request = new Request('http://example.test');
      expect(
        cookie({ name: 'locale' }).getFromRequest?.(request),
      ).toBeUndefined();
    });
  });

  describe('in non-browser environment', () => {
    it('returns `undefined` from `get` when `document` is missing', () => {
      expect(cookie({ name: 'locale' }).get()).toBeUndefined();
    });

    it('blocks `set` when `document` is missing', () => {
      expect(() => cookie({ name: 'locale' }).set('sv')).not.toThrow();
    });
  });
});

describe('createPersistence', () => {
  it('returns `true` from set when underlying set returns `true`', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => true,
    });
    expect(persistence.set('sv')).toBe(true);
  });

  it('returns `false` from set when underlying set returns `false`', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => false,
    });
    expect(persistence.set('sv')).toBe(false);
  });

  it('returns `false` from set when underlying set returns `undefined`', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => undefined,
    });
    expect(persistence.set('sv')).toBe(false);
  });

  it('returns `undefined` for `getFromRequest` when not provided', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => undefined,
    });
    expect(persistence.getFromRequest).toBeUndefined();
  });
});

describe('localStorage', () => {
  describe('in browser', () => {
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

    it('returns the value from `localStorage`', () => {
      storage.set('locale', 'sv');
      expect(localStorage({ key: 'locale' }).get()).toBe('sv');
    });

    it('writes to `localStorage` on set', () => {
      localStorage({ key: 'locale' }).set('fr');
      expect(storage.get('locale')).toBe('fr');
    });

    it('writes under the configured storage key', () => {
      localStorage({ key: 'custom-key' }).set('de');
      expect(storage.get('custom-key')).toBe('de');
    });

    it('returns `false` from set', () => {
      expect(localStorage({ key: 'locale' }).set('sv')).toBe(false);
    });

    it('returns `undefined` for `getFromRequest`', () => {
      expect(localStorage({ key: 'locale' }).getFromRequest).toBeUndefined();
    });

    it('returns `undefined` when key is missing', () => {
      expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
    });

    it('returns `undefined` when `getItem` throws', () => {
      vi.stubGlobal('localStorage', {
        getItem() {
          throw new Error('blocked');
        },
        setItem() {},
      });
      expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
    });

    it('blocks `setItem` errors', () => {
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
  });

  describe('in non-browser environment', () => {
    it('returns `undefined` from `get` when storage is missing', () => {
      expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
    });

    it('blocks `set` when storage is missing', () => {
      expect(() => localStorage({ key: 'locale' }).set('sv')).not.toThrow();
    });
  });
});
