import { createPersistence, parseCookie } from '../persistence';
import { resolveLocale } from './resolve';
import {
  ACCEPT_LANGUAGE,
  DEFAULT_LOCALE,
  LOCALES,
  PERSISTENCE,
  SYNC_HTML_LANG,
} from 'virtual:yapyak';

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

const persistence = createPersistence(PERSISTENCE);

function initialLocale(): string {
  const persisted = persistence?.get();
  if (persisted !== undefined && LOCALES.includes(persisted)) {
    return persisted;
  }
  return DEFAULT_LOCALE;
}

let currentLocale = initialLocale();
const listeners = new Set<(state: I18n) => void>();

if (SYNC_HTML_LANG && typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale;
}

function getLocale(): string {
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

function setLocale(value: string): void {
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
    listener(i18n);
  }
}

/** Yapyak's i18n state namespace. */
export interface I18n {
  /** The default locale (build-time constant). */
  readonly defaultLocale: string;
  /** The currently-active locale. */
  readonly locale: string;
  /** All configured locales (build-time constant). */
  readonly locales: readonly string[];
  /**
   * Switch the active locale. No-op if `value` is not in `locales`.
   *
   * @param value - The locale to switch to.
   */
  setLocale(value: string): void;
  /**
   * Subscribe to i18n state changes.
   *
   * @param fn - Callback fired whenever the i18n state changes. Receives the
   *   current `i18n` state.
   * @returns A function that unsubscribes the listener.
   */
  subscribe(fn: (state: I18n) => void): () => void;
}

/**
 * The i18n namespace.
 *
 * Holds the active locale and exposes operations to read and mutate it.
 * Framework adapters wrap this with reactive bindings.
 *
 * @example
 * ```ts
 * import { i18n } from 'yapyak';
 *
 * console.log(i18n.locale);            // 'en'
 * i18n.setLocale('sv');
 *
 * i18n.subscribe((state) => {
 *   localStorage.setItem('locale', state.locale);
 * });
 * ```
 */
export const i18n: I18n = {
  defaultLocale: DEFAULT_LOCALE,
  get locale(): string {
    return getLocale();
  },
  locales: LOCALES,
  setLocale,
  subscribe(fn: (state: I18n) => void): () => void {
    listeners.add(fn);
    return (): void => {
      listeners.delete(fn);
    };
  },
};

/** @internal */
export function resetI18n(): void {
  currentLocale = initialLocale();
  listeners.clear();
}
