import { cookie } from './cookie';
import { localStorage } from './local-storage';

/** @internal */
export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;

/** @internal */
export interface Persistence {
  get(): string | undefined;
  set(locale: string): void;
}

/** @internal */
export function createPersistence(
  config: NormalizedPersistence,
): Persistence | null {
  if (config === null) {
    return null;
  }
  if (config.type === 'cookie') {
    return cookie(config.name);
  }
  if (config.type === 'localStorage') {
    return localStorage(config.key);
  }
  return null;
}

export { parseCookie } from './cookie';
