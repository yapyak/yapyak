import type { Persistence } from '.';

export function localStorage(key: string): Persistence {
  return {
    get() {
      if (typeof globalThis.localStorage === 'undefined') {
        return undefined;
      }
      try {
        const value = globalThis.localStorage.getItem(key);
        return value === null || value === '' ? undefined : value;
      } catch {
        return undefined;
      }
    },
    set(locale) {
      if (typeof globalThis.localStorage === 'undefined') {
        return;
      }
      try {
        globalThis.localStorage.setItem(key, locale);
      } catch {}
    },
  };
}
