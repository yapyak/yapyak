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
        return;
      }
      try {
        globalThis.localStorage.setItem(key, locale);
      } catch {}
    },
  });
}
