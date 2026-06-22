export type Persistence = {
  get(): string | undefined;
  getFromRequest?(request: Request): string | undefined;
  set(locale: string): boolean;
  subscribe?(onChange: () => void): () => void;
};

/**
 * The cookie persistence configuration.
 */
export type CookiePersistenceOptions = {
  /**
   * The cookie name.
   *
   * @defaultValue `'locale'`
   */
  name?: string;
  /**
   * Whether the cookie is marked as `Secure`.
   *
   * @defaultValue `false`
   */
  secure?: boolean;
  /** The discriminator. */
  type: 'cookie';
};

/**
 * The localStorage persistence configuration.
 */
export type LocalStoragePersistenceOptions = {
  /**
   * The storage key.
   *
   * @defaultValue `'locale'`
   */
  key?: string;
  /** The discriminator. */
  type: 'local-storage';
};

/**
 * The URL persistence configuration.
 */
export type UrlPersistenceOptions = {
  /**
   * The pattern matching the locale segment.
   *
   * @remarks
   * The first capture group supplies the locale. Falls back to the first path segment when omitted.
   */
  match?: RegExp;
  /** The discriminator. */
  type: 'url';
};

/** The none persistence configuration. */
export type NonePersistenceOptions = {
  /** The discriminator. */
  type: 'none';
};

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
  | {
      type: 'cookie';
      name: string;
      secure: boolean;
    }
  | {
      type: 'local-storage';
      key: string;
    }
  | {
      type: 'url';
      match?: RegExp;
    }
  | {
      type: 'none';
    };
