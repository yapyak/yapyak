import { cookie } from './cookie';
import { localStorage } from './local-storage';

type PersistenceConfig =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | null;

/** @internal */
export interface Persistence {
  get(): string | undefined;
  set(locale: string): void;
}

/** @internal */
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

export { parseCookie } from './cookie';
