import { detectLocale } from './detect.js';
import { parseCookie } from '../parse-cookie.js';
import {
  createPersistence,
  type PersistenceConfig,
} from './persistence.js';

/** Options for configuring the locale store. */
export interface LocaleStoreOptions {
  /** Enable Accept-Language header detection on the server. */
  acceptLanguage?: boolean;
  /** Cookie name for locale persistence. Defaults to `'locale'`. */
  cookieName?: string;
  /** The fallback locale used when no other locale is resolved. */
  defaultLocale: string;
  /** The initial locale to use before any user selection. */
  initialLocale?: string;
  /** All locales the app supports. */
  locales: string[];
  /** Where to persist the user's locale selection. */
  persistence?: 'cookie' | 'localStorage' | null;
  /** localStorage key for locale persistence. Defaults to `'yapyak:locale'`. */
  storageKey?: string;
}

export interface RequestSource {
  acceptLanguage?: string | undefined;
  cookieHeader?: string | undefined;
}

export type RequestSourceProvider = () => RequestSource | undefined;

export interface LocaleStore {
  cookieName: string;
  defaultLocale: string;
  get(): string;
  getSnapshot(): string;
  locales: string[];
  set(locale: string): void;
  setRequestSource(provider: RequestSourceProvider | null): void;
  subscribe(listener: () => void): () => void;
}

export function createLocaleStore(options: LocaleStoreOptions): LocaleStore {
  const listeners = new Set<() => void>();
  const cookieName = options.cookieName ?? 'locale';
  const storageKey = options.storageKey ?? 'yapyak:locale';
  const acceptLanguage = options.acceptLanguage ?? false;
  const persistence = createPersistence(
    buildPersistenceConfig(options.persistence ?? null, cookieName, storageKey),
  );
  const persisted = persistence?.load();
  const initial =
    persisted && options.locales.includes(persisted)
      ? persisted
      : options.initialLocale && options.locales.includes(options.initialLocale)
        ? options.initialLocale
        : options.defaultLocale;
  let locale = initial;
  let version = 0;
  let snapshot = `${locale}#${version}`;
  let requestSource: RequestSourceProvider | null = null;

  function resolveLocale(): string {
    if (requestSource !== null && typeof window === 'undefined') {
      const source = requestSource();
      if (source !== undefined) {
        const persisted = readCookieValue(source.cookieHeader, cookieName);
        return detectLocale({
          acceptLanguage: acceptLanguage ? source.acceptLanguage : undefined,
          defaultLocale: options.defaultLocale,
          locales: options.locales,
          persisted,
        });
      }
    }
    return locale;
  }

  return {
    cookieName,
    defaultLocale: options.defaultLocale,
    locales: options.locales,
    get() {
      return resolveLocale();
    },
    getSnapshot() {
      if (requestSource !== null && typeof window === 'undefined') {
        return resolveLocale();
      }
      return snapshot;
    },
    set(next) {
      if (!options.locales.includes(next)) {
        return;
      }
      if (next === locale) {
        return;
      }
      locale = next;
      version++;
      snapshot = `${locale}#${version}`;
      persistence?.save(next);
      for (const listener of listeners) {
        listener();
      }
    },
    setRequestSource(provider) {
      requestSource = provider;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function readCookieValue(
  header: string | undefined,
  name: string,
): string | undefined {
  if (header === undefined || header === '') {
    return undefined;
  }
  const value = parseCookie(header)[name];
  return value === '' ? undefined : value;
}

let activeStore: LocaleStore | null = null;

/** @internal */
export function configureLocale(options: LocaleStoreOptions): LocaleStore {
  activeStore = createLocaleStore(options);
  return activeStore;
}

/** @internal */
export function getLocaleStore(): LocaleStore {
  if (activeStore === null) {
    activeStore = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en'],
    });
  }
  return activeStore;
}

export function resetLocaleStore(): void {
  activeStore = null;
}

function buildPersistenceConfig(
  kind: 'cookie' | 'localStorage' | null,
  cookieName: string,
  storageKey: string,
): PersistenceConfig {
  if (kind === 'cookie') {
    return { cookieName, kind: 'cookie' };
  }
  if (kind === 'localStorage') {
    return { kind: 'localStorage', storageKey };
  }
  return { kind: null };
}

/** Returns the current locale. */
export function getLocale(): string {
  return getLocaleStore().get();
}

/**
 * Switches the active locale.
 *
 * No-op if the locale is not in the configured `locales` list. Triggers
 * re-renders in framework integrations (`useLocale`, Svelte/Vue stores).
 *
 * @param locale - The locale to switch to.
 */
export function setLocale(locale: string): void {
  getLocaleStore().set(locale);
}

/** Returns the list of configured locales. */
export function getLocales(): string[] {
  return getLocaleStore().locales;
}

/** Returns the configured default locale. */
export function getDefaultLocale(): string {
  return getLocaleStore().defaultLocale;
}

/** @internal */
export function setRequestSource(provider: RequestSourceProvider | null): void {
  getLocaleStore().setRequestSource(provider);
}
