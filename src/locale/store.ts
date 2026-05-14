import {
  ACCEPT_LANGUAGE,
  COOKIE_NAME,
  DEFAULT_LOCALE,
  LOCALES,
  MANUAL_HTML_LANG,
  PERSISTENCE,
  STORAGE_KEY,
} from 'virtual:yapyak';
import { parseCookie } from '../parse-cookie.js';
import { detectLocale } from './detect.js';
import { createPersistence, type PersistenceConfig } from './persistence.js';

interface RequestHeaders {
  acceptLanguage: string | undefined;
  cookieHeader: string | undefined;
}

type RequestHeadersReader = () => RequestHeaders | undefined;

let headersReader: RequestHeadersReader | null = null;

/** @internal */
export function registerRequestHeadersReader(
  reader: RequestHeadersReader,
): void {
  headersReader = reader;
}

const persistence = createPersistence(
  buildPersistenceConfig(PERSISTENCE, COOKIE_NAME, STORAGE_KEY),
);

function initialLocale(): string {
  const persisted = persistence?.load();
  if (persisted !== undefined && LOCALES.includes(persisted)) {
    return persisted;
  }
  return DEFAULT_LOCALE;
}

let currentLocale = initialLocale();
let version = 0;
let snapshot = `${currentLocale}#${version}`;
const listeners = new Set<() => void>();

if (!MANUAL_HTML_LANG && typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale;
}

function resolveLocale(): string {
  if (typeof window === 'undefined' && headersReader !== null) {
    const source = headersReader();
    if (source !== undefined) {
      const persisted = readCookieValue(source.cookieHeader, COOKIE_NAME);
      return detectLocale({
        acceptLanguage: ACCEPT_LANGUAGE ? source.acceptLanguage : undefined,
        defaultLocale: DEFAULT_LOCALE,
        locales: LOCALES,
        persisted,
      });
    }
  }
  return currentLocale;
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
  return resolveLocale();
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
  if (!LOCALES.includes(locale)) {
    return;
  }
  if (locale === currentLocale) {
    return;
  }
  currentLocale = locale;
  version++;
  snapshot = `${currentLocale}#${version}`;
  persistence?.save(locale);
  if (!MANUAL_HTML_LANG && typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  for (const listener of listeners) {
    listener();
  }
}

/** Returns the list of configured locales. */
export function getLocales(): string[] {
  return LOCALES;
}

/** Returns the configured default locale. */
export function getDefaultLocale(): string {
  return DEFAULT_LOCALE;
}

/** @internal */
export function getLocaleSnapshot(): string {
  if (
    typeof window === 'undefined' &&
    headersReader !== null &&
    headersReader() !== undefined
  ) {
    return resolveLocale();
  }
  return snapshot;
}

/** @internal */
export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** @internal */
export function resetLocaleStore(): void {
  currentLocale = initialLocale();
  version = 0;
  snapshot = `${currentLocale}#${version}`;
  listeners.clear();
}
