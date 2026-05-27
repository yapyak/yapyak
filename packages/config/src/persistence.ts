/** The cookie persistence configuration. */
export interface CookiePersistence {
  /**
   * The cookie name.
   *
   * @defaultValue `'locale'`
   */
  name?: string;
  type: 'cookie';
}

/** The localStorage persistence configuration. */
export interface LocalStoragePersistence {
  /**
   * The storage key.
   *
   * @defaultValue `'locale'`
   */
  key?: string;
  type: 'local-storage';
}

/** The URL persistence configuration. */
export interface UrlPersistence {
  /**
   * The pattern that matches the locale segment in the URL.
   *
   * @defaultValue `/^[/](?<locale>[^/]+)/`
   */
  match?: RegExp;
  type: 'url';
}

/** The locale persistence strategy. */
export type Persistence =
  | 'cookie'
  | 'local-storage'
  | 'url'
  | CookiePersistence
  | LocalStoragePersistence
  | UrlPersistence
  | null;
