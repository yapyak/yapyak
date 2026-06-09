/** The runtime persistence instance. */
export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
  subscribe?(onChange: () => void): () => void;
}

/**
 * The cookie persistence configuration.
 *
 * @example Store locale under a custom cookie name
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   defaultLocale: 'sv',
 *   persistence: { type: 'cookie', name: 'lang' },
 * });
 * ```
 */
export interface CookiePersistenceOptions {
  /**
   * The cookie name.
   *
   * @defaultValue `'locale'`
   */
  name?: string;
  type: 'cookie';
}

/**
 * The localStorage persistence configuration.
 *
 * @example Store locale under a custom storage key
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   defaultLocale: 'sv',
 *   persistence: { type: 'local-storage', key: 'lang' },
 * });
 * ```
 */
export interface LocalStoragePersistenceOptions {
  /**
   * The storage key.
   *
   * @defaultValue `'locale'`
   */
  key?: string;
  type: 'local-storage';
}

/**
 * The URL persistence configuration.
 *
 * @example Read locale from a query parameter
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   defaultLocale: 'sv',
 *   persistence: {
 *     type: 'url',
 *     match: /[?&]lang=(?<locale>[^&]+)/,
 *   },
 * });
 * ```
 */
export interface UrlPersistenceOptions {
  /**
   * The pattern that matches the locale segment in the URL.
   *
   * @remarks
   * The first capture group (named `locale` or positional `$1`) supplies the locale string. When omitted, the locale is read from the first path segment via `url.pathname.split('/')[1]` and only accepted when it's in the configured locales.
   */
  match?: RegExp;
  type: 'url';
}

/** The none persistence configuration. */
export interface NonePersistenceOptions {
  type: 'none';
}

/** The locale persistence strategy. */
export type PersistenceConfig =
  | 'cookie'
  | 'local-storage'
  | 'url'
  | 'none'
  | CookiePersistenceOptions
  | LocalStoragePersistenceOptions
  | UrlPersistenceOptions
  | NonePersistenceOptions;

export type NormalizedPersistenceConfig =
  | { type: 'cookie'; name: string }
  | { type: 'local-storage'; key: string }
  | { type: 'url'; match?: RegExp }
  | { type: 'none' };
