import { parseCookie } from '../parse-cookie.js';

export type PersistenceKind = 'cookie' | 'localStorage';

export type PersistenceConfig =
  | { cookieName: string; kind: 'cookie' }
  | { kind: 'localStorage'; storageKey: string }
  | { kind: null };

export interface Persistence {
  load(): string | undefined;
  save(locale: string): void;
}

export const DEFAULT_COOKIE_NAME = 'locale';
export const DEFAULT_STORAGE_KEY = 'yapyak:locale';

export function createPersistence(
  config: PersistenceConfig,
): Persistence | null {
  if (config.kind === null) {
    return null;
  }
  if (config.kind === 'cookie') {
    return cookiePersistence(config.cookieName);
  }
  return localStoragePersistence(config.storageKey);
}

function cookiePersistence(name: string): Persistence {
  return {
    load() {
      if (typeof document === 'undefined') {
        return undefined;
      }
      const cookies = parseCookie(document.cookie);
      const value = cookies[name];
      return value === '' ? undefined : value;
    },
    save(locale) {
      if (typeof document === 'undefined') {
        return;
      }
      const value = encodeURIComponent(locale);
      document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
    },
  };
}

function localStoragePersistence(key: string): Persistence {
  return {
    load() {
      if (typeof localStorage === 'undefined') {
        return undefined;
      }
      try {
        const value = localStorage.getItem(key);
        return value === null || value === '' ? undefined : value;
      } catch {
        return undefined;
      }
    },
    save(locale) {
      if (typeof localStorage === 'undefined') {
        return;
      }
      try {
        localStorage.setItem(key, locale);
      } catch {
        // ignore quota / privacy-mode errors
      }
    },
  };
}
