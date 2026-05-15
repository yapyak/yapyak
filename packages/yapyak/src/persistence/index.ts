import { cookie } from './cookie.ts';
import { localStorage } from './local-storage.ts';

type PersistenceConfig =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | null;

export interface Persistence {
  get(): string | undefined;
  set(locale: string): void;
}

export function createPersistence(
  config: PersistenceConfig,
): Persistence | null {
  if (config === null) {
    return null;
  }
  if (config.type === 'cookie') {
    return cookie(config.name);
  }
  return localStorage(config.key);
}

export { parseCookie } from './cookie.ts';
