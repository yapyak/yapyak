import { createPersistence, parseCookie } from '../persistence';
import { resolveLocale } from './resolve';
import {
  ACCEPT_LANGUAGE,
  DEFAULT_LOCALE,
  LOCALES,
  PERSISTENCE,
  SYNC_HTML_LANG,
} from 'virtual:yapyak';

/** @internal */
export interface RequestHeaders {
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

const persistence = createPersistence(PERSISTENCE);

function getInitialLocale(): string {
  const persisted = persistence?.get();
  if (persisted !== undefined && LOCALES.includes(persisted)) {
    return persisted;
  }
  return DEFAULT_LOCALE;
}

let currentLocale = getInitialLocale();
const listeners = new Set<(locale: string) => void>();

if (SYNC_HTML_LANG && typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale;
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

/**
 * Returns the currently-active locale.
 *
 * @returns The active locale code.
 *
 * @example
 * ```ts
 * import { getLocale } from 'yapyak';
 *
 * console.log(getLocale());   // 'sv'
 * ```
 */
export function getLocale(): string {
  if (typeof window === 'undefined' && headersReader !== null) {
    const source = headersReader();
    if (source !== undefined) {
      const cookieName =
        PERSISTENCE?.type === 'cookie' ? PERSISTENCE.name : null;
      const persisted =
        cookieName !== null
          ? readCookieValue(source.cookieHeader, cookieName)
          : undefined;
      return resolveLocale({
        acceptLanguage: ACCEPT_LANGUAGE ? source.acceptLanguage : undefined,
        defaultLocale: DEFAULT_LOCALE,
        locales: LOCALES,
        persisted,
      });
    }
  }
  return currentLocale;
}

/**
 * Switch the active locale. No-op if `value` is not in `locales`.
 *
 * Notifies subscribers and framework adapters.
 *
 * @param value - The locale to switch to.
 *
 * @example
 * ```ts
 * import { setLocale } from 'yapyak';
 *
 * setLocale('sv');
 * ```
 */
export function setLocale(value: string): void {
  if (!LOCALES.includes(value)) {
    return;
  }
  if (value === currentLocale) {
    return;
  }
  currentLocale = value;
  persistence?.set(value);
  if (SYNC_HTML_LANG && typeof document !== 'undefined') {
    document.documentElement.lang = value;
  }
  for (const listener of listeners) {
    listener(value);
  }
}

/** All configured locales (build-time constant). */
export const locales: string[] = LOCALES;

/** The default locale (build-time constant). */
export const defaultLocale: string = DEFAULT_LOCALE;

/**
 * Subscribe to locale changes.
 *
 * @param fn - Callback fired whenever the locale changes. Receives the new locale.
 * @returns A function that unsubscribes the listener.
 *
 * @example
 * ```ts
 * import { subscribeLocale } from 'yapyak';
 *
 * const unsubscribe = subscribeLocale((locale) => {
 *   document.documentElement.lang = locale;
 * });
 * ```
 */
export function subscribeLocale(fn: (locale: string) => void): () => void {
  listeners.add(fn);
  return (): void => {
    listeners.delete(fn);
  };
}

/** @internal */
export function resetLocale(): void {
  currentLocale = getInitialLocale();
  listeners.clear();
}
