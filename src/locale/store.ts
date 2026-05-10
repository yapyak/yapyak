import { detectLocale } from './detect.js';
import { parseCookie } from '../parse-cookie.js';

export interface LocaleStoreOptions {
  acceptLanguage?: boolean;
  cookieName?: string;
  defaultLocale: string;
  initialLocale?: string;
  locales: string[];
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
  const acceptLanguage = options.acceptLanguage ?? false;
  const initial =
    options.initialLocale && options.locales.includes(options.initialLocale)
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

export function configureLocale(options: LocaleStoreOptions): LocaleStore {
  activeStore = createLocaleStore(options);
  return activeStore;
}

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

export function getLocale(): string {
  return getLocaleStore().get();
}

export function setLocale(locale: string): void {
  getLocaleStore().set(locale);
}

export function setRequestSource(provider: RequestSourceProvider | null): void {
  getLocaleStore().setRequestSource(provider);
}
