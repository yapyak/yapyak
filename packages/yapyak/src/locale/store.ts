import type { Locale } from './type';

import {
  DEFAULT_LOCALE,
  DETECT_ACCEPT_LANGUAGE,
  LOCALES,
  PERSISTENCE_CONFIG,
  SYNC_HTML_LANG,
} from 'yapyak/runtime';

import { buildPersistence } from '../persistence';
import { readRequest } from './request-reader';
import { resolveLocale } from './resolve';

let hasWarnedUninitialized = false;

const persistence = buildPersistence(PERSISTENCE_CONFIG, LOCALES);

/**
 * Type guard — narrows `string` to {@link Locale} when value matches a configured locale.
 *
 * @param value - The candidate string.
 *
 * @example Narrow a URL parameter to Locale
 * ```ts
 * import { isLocale } from 'yapyak';
 *
 * if (isLocale(params.locale)) {
 *   // params.locale is now typed as Locale
 * }
 * ```
 */
export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value);
}

function getInitialLocale(): Locale {
  const persisted = persistence?.get();
  if (persisted !== undefined && isLocale(persisted)) {
    return persisted;
  }
  return DEFAULT_LOCALE;
}

let currentLocale: Locale = getInitialLocale();
const listeners = new Set<(locale: Locale) => void>();

if (SYNC_HTML_LANG && typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale;
}

function applyLocale(value: Locale): void {
  if (value === currentLocale) {
    return;
  }
  currentLocale = value;
  if (SYNC_HTML_LANG && typeof document !== 'undefined') {
    document.documentElement.lang = value;
  }
  for (const listener of listeners) {
    listener(value);
  }
}

function syncFromPersistence(): void {
  const persisted = persistence?.get();
  if (persisted !== undefined && isLocale(persisted)) {
    applyLocale(persisted);
  }
}

persistence?.subscribe?.(syncFromPersistence);

/**
 * The current locale.
 *
 * @remarks
 * Server-side, reads from the request bound by {@link withRequest} via persistence or the `Accept-Language` header. Otherwise returns the locale set by {@link setLocale}.
 *
 * @example Read the current locale
 * ```ts
 * import { getLocale } from 'yapyak';
 *
 * getLocale(); // => 'sv'
 * ```
 */
export function getLocale(): Locale {
  if (
    !hasWarnedUninitialized &&
    process.env.NODE_ENV !== 'production' &&
    LOCALES.length === 0
  ) {
    hasWarnedUninitialized = true;
    console.warn(
      '[yapyak] yapyak runtime not initialized — register the build-tool plugin (@yapyak/vite) in your bundler config.',
    );
  }
  if (typeof window === 'undefined') {
    const request = readRequest();
    if (request) {
      const fromPersistence = persistence?.getFromRequest?.(request);
      if (fromPersistence !== undefined && isLocale(fromPersistence)) {
        return fromPersistence;
      }
      if (DETECT_ACCEPT_LANGUAGE) {
        const resolved = resolveLocale({
          acceptLanguage: request.headers.get('accept-language') ?? undefined,
          defaultLocale: DEFAULT_LOCALE,
          locales: LOCALES,
        });
        return isLocale(resolved) ? resolved : DEFAULT_LOCALE;
      }
      return DEFAULT_LOCALE;
    }
  }
  return currentLocale;
}

/**
 * Switches the locale.
 *
 * @remarks
 * No-op if `value` is not in {@link locales}. Notifies subscribers. No-op with `persistence: 'url'` — the URL is the source of truth, and the in-memory locale syncs on URL change driven by router navigation.
 *
 * @param value - The locale to switch to.
 *
 * @example Switch to Swedish
 * ```ts
 * import { setLocale } from 'yapyak';
 *
 * setLocale('sv');
 * ```
 */
export function setLocale(value: Locale): void {
  if (!LOCALES.includes(value)) {
    return;
  }

  if (persistence?.set(value) === true) {
    return;
  }

  applyLocale(value);
}

/** The configured locales. Build-time constant. Inlined by yapyak's compiler. */
export const locales: Locale[] = LOCALES;

/** The default locale. Build-time constant. Inlined by yapyak's compiler. */
export const defaultLocale: Locale = DEFAULT_LOCALE;

export function subscribeLocale(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return (): void => {
    listeners.delete(fn);
  };
}

export function resetLocale(): void {
  currentLocale = getInitialLocale();
  listeners.clear();
}
