import { createPersistence, parseCookie } from '../persistence';
import { resolveLocale } from './resolve';
import { applyLocaleToUrl, getLocaleFromUrl } from './url';
import {
  DEFAULT_LOCALE,
  DETECT_ACCEPT_LANGUAGE,
  LOCALES,
  PERSISTENCE,
  SYNC_HTML_LANG,
} from 'virtual:yapyak';

/** @internal */
export interface RequestHeaders {
  acceptLanguage: string | undefined;
  cookieHeader: string | undefined;
  url: string | undefined;
}

type RequestHeadersReader = () => RequestHeaders | undefined;

let headersReader: RequestHeadersReader | null = null;

/** @internal */
export function registerRequestHeadersReader(
  reader: RequestHeadersReader,
): void {
  headersReader = reader;
}

const urlMatch: RegExp | undefined =
  PERSISTENCE?.type === 'url' && PERSISTENCE.match !== undefined
    ? new RegExp(PERSISTENCE.match.source, PERSISTENCE.match.flags)
    : undefined;

const persistence = createPersistence(
  PERSISTENCE === null
    ? null
    : PERSISTENCE.type === 'url'
      ? { type: 'url', match: urlMatch }
      : PERSISTENCE,
);

function getInitialLocale(): string {
  if (PERSISTENCE?.type === 'url' && typeof window !== 'undefined') {
    const fromUrl = getLocaleFromUrl(window.location, LOCALES, urlMatch);
    if (fromUrl !== undefined) {
      return fromUrl;
    }
    return DEFAULT_LOCALE;
  }
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
 * The currently-active locale.
 *
 * @example
 * ```ts
 * import { getLocale } from '@yapyak/core';
 *
 * getLocale(); // => 'sv'
 * ```
 */
export function getLocale(): string {
  if (typeof window === 'undefined' && headersReader !== null) {
    const source = headersReader();
    if (source !== undefined) {
      if (PERSISTENCE?.type === 'url' && source.url !== undefined) {
        const url = new URL(source.url);
        const fromUrl = getLocaleFromUrl(url, LOCALES, urlMatch);
        if (fromUrl !== undefined) {
          return fromUrl;
        }
        return DEFAULT_LOCALE;
      }
      const cookieName =
        PERSISTENCE?.type === 'cookie' ? PERSISTENCE.name : null;
      const persisted =
        cookieName !== null
          ? readCookieValue(source.cookieHeader, cookieName)
          : undefined;
      return resolveLocale({
        acceptLanguage: DETECT_ACCEPT_LANGUAGE
          ? source.acceptLanguage
          : undefined,
        defaultLocale: DEFAULT_LOCALE,
        locales: LOCALES,
        persisted,
      });
    }
  }
  return currentLocale;
}

/**
 * Switches the active locale.
 *
 * @remarks
 * No-op if `value` is not in {@link locales}. Notifies subscribers and framework adapters.
 *
 * With `persistence: 'url'`, locale changes are coupled to the URL. If the target URL differs from the current URL, `setLocale` falls back to a full-page navigation via `window.location.href`. Drive locale switches through your router's navigation API (e.g. `router.navigate(...)`) so the URL change happens via SPA navigation, then the route loader calls `setLocale` with the URL already matching — no reload.
 *
 * @param value - The locale to switch to.
 *
 * @example
 * ```ts
 * import { setLocale } from '@yapyak/core';
 *
 * setLocale('sv');
 * ```
 */
export function setLocale(value: string): void {
  if (!LOCALES.includes(value)) {
    return;
  }

  if (PERSISTENCE?.type === 'url' && typeof window !== 'undefined') {
    const target = applyLocaleToUrl(window.location, value, LOCALES, urlMatch);
    const current =
      window.location.pathname + window.location.search + window.location.hash;
    if (target !== current) {
      window.location.href = target;
      return;
    }
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
 * Subscribes to locale changes.
 *
 * @param fn - Called whenever the locale changes. Receives the new locale.
 * @returns The unsubscribe function.
 *
 * @example
 * ```ts
 * import { subscribeLocale } from '@yapyak/core';
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
