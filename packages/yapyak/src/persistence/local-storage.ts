import type { Persistence } from './type';

import { warnDiagnostic } from '../diagnostic';

type LocalStorageOptions = {
  key: string;
};

export function localStorage(options: LocalStorageOptions): Persistence {
  const { key } = options;
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
        warnDiagnostic('PERSISTENCE_LOCAL_STORAGE_SSR_SKIPPED', undefined);
        return false;
      }
      try {
        globalThis.localStorage.setItem(key, locale);
        return true;
      } catch (cause) {
        warnDiagnostic('PERSISTENCE_LOCAL_STORAGE_WRITE_FAILED', undefined, {
          cause,
        });
        return false;
      }
    },
  };
}
