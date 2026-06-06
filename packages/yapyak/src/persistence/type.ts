/** The runtime persistence instance. */
export interface Persistence {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
  subscribe?(onChange: () => void): () => void;
}

/** The cookie persistence configuration. */
export interface CookiePersistenceOptions {
  /**
   * The cookie name.
   *
   * @defaultValue `'locale'`
   */
  name?: string;
  type: 'cookie';
}

/** The localStorage persistence configuration. */
export interface LocalStoragePersistenceOptions {
  /**
   * The storage key.
   *
   * @defaultValue `'locale'`
   */
  key?: string;
  type: 'local-storage';
}

/** The URL persistence configuration. */
export interface UrlPersistenceOptions {
  /**
   * The pattern that matches the locale segment in the URL.
   *
   * @defaultValue `/^[/](?<locale>[^/]+)/`
   */
  match?: RegExp;
  type: 'url';
}

/** The locale persistence strategy. */
export type PersistenceConfig =
  | 'cookie'
  | 'local-storage'
  | 'url'
  | CookiePersistenceOptions
  | LocalStoragePersistenceOptions
  | UrlPersistenceOptions
  | null;

export type NormalizedPersistenceConfig =
  | { type: 'cookie'; name: string }
  | { type: 'local-storage'; key: string }
  | { type: 'url'; match?: RegExp }
  | null;
