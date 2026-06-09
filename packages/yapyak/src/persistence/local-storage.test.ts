import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
import { localStorage } from './local-storage';

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

    it('returns true from set in the browser', () => {
      expect(localStorage({ key: 'locale' }).set('sv')).toBe(true);
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
    afterEach(() => {
      resetWarn();
    });

    it('returns `undefined` from `get` when storage is missing', () => {
      expect(localStorage({ key: 'locale' }).get()).toBeUndefined();
    });

    it('blocks `set` when storage is missing', () => {
      setWarn(vi.fn());
      expect(() => localStorage({ key: 'locale' }).set('sv')).not.toThrow();
    });

    it('returns false from `set` when storage is missing', () => {
      setWarn(vi.fn());
      expect(localStorage({ key: 'locale' }).set('sv')).toBe(false);
    });

    it('warns that local-storage is browser-only', () => {
      const stub = vi.fn();
      setWarn(stub);

      localStorage({ key: 'locale' }).set('sv');

      expect(stub).toHaveBeenCalledWith(
        expect.stringContaining(
          'setLocale() is a no-op server-side with persistence: "local-storage"',
        ),
        expect.objectContaining({
          code: 'YPK_PERSISTENCE_LOCAL_STORAGE_SSR_NOOP',
        }),
      );
    });
  });
});
