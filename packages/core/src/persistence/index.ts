import { cookie } from './cookie';
import { localStorage } from './local-storage';
import { url } from './url';

/** @internal */
export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;

type SerializedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | { type: 'url'; match?: { flags: string; source: string } }
  | null;

export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
}

export interface CreatePersistenceOptions {
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
  config: SerializedPersistence,
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
  const match =
    config.match !== undefined
      ? new RegExp(config.match.source, config.match.flags)
      : undefined;
  return url({ locales, match });
}
