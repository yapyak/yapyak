import type { NormalizedPersistence } from '@yapyak/runtime';

import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { url } from './url';

export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
}

interface CreatePersistenceOptions {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean | void;
}

export function createPersistence(
  options: CreatePersistenceOptions,
): Persistence {
  return {
    get: options.get,
    getFromRequest: options.getFromRequest,
    set: (locale) => options.set(locale) === true,
  };
}

export function buildPersistence(
  config: NormalizedPersistence,
  locales: readonly string[],
): Persistence | null {
  if (config === null) {
    return null;
  }
  if (config.type === 'cookie') {
    return cookie({ name: config.name });
  }
  if (config.type === 'localStorage') {
    return localStorage({ key: config.key });
  }
  return url({ locales, match: config.match });
}
