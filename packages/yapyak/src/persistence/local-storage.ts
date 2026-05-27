import type { Persistence } from '.';

import { createPersistence } from '.';

interface LocalStorageOptions {
  key: string;
}

export function localStorage(options: LocalStorageOptions): Persistence {
  const { key } = options;
  return createPersistence({
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
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[yapyak] setLocale() is a no-op server-side with persistence: "local-storage". localStorage is browser-only. Use persistence: "cookie" for SSR-compatible locale switching.',
          );
        }
        return true;
      }
      try {
        globalThis.localStorage.setItem(key, locale);
      } catch {}
    },
  });
}
