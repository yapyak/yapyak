import { parseCookie } from './parse-cookie.ts';

export type PersistenceConfig =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | null;

export interface Persistence {
  load(): string | undefined;
  save(locale: string): void;
}

export function createPersistence(
  config: PersistenceConfig,
): Persistence | null {
  if (config === null) {
    return null;
  }
  if (config.type === 'cookie') {
    return cookiePersistence(config.name);
  }
  return localStoragePersistence(config.key);
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
      // biome-ignore lint/suspicious/noDocumentCookie: Needed
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
