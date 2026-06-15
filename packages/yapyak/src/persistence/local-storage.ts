import type { Persistence } from './type';

import { YAP } from '../diagnostics/codes';
import { warn } from '../warn';

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
        warn(
          'setLocale() skipped on the server with persistence `local-storage`. `localStorage` is browser-only. Use persistence `cookie` for SSR-compatible locale switching.',
          {
            code: YAP.PERSISTENCE_LOCAL_STORAGE_SSR_SKIPPED,
          },
        );
        return false;
      }
      try {
        globalThis.localStorage.setItem(key, locale);
        return true;
      } catch (cause) {
        warn(
          'setLocale() failed to write to `localStorage`. The in-memory locale was updated but will not survive a reload. Common causes are quota exceeded, Safari private mode, or storage disabled.',
          {
            cause,
            code: YAP.PERSISTENCE_LOCAL_STORAGE_WRITE_FAILED,
          },
        );
        return false;
      }
    },
  };
}
