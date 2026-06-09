import type { Locale } from './type';

import {
  DEFAULT_LOCALE,
  DETECT_ACCEPT_LANGUAGE,
  LOCALES,
  PERSISTENCE_CONFIG,
  SYNC_HTML_LANG,
} from 'yapyak/runtime';

import { registerHotDispose } from '../hot-dispose';
import { buildPersistence } from '../persistence';
import { warn } from '../warn';
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
 * Server-side, reads from the request bound by {@link withRequest} via persistence or the `Accept-Language` header. When no request is bound (e.g. outside any host-integration middleware), falls through to the module-scope locale shared across requests — the same value {@link setLocale} writes — which can leak between concurrent requests. Client-side, returns the locale set by {@link setLocale}.
 *
 * @example Read the current locale
 * ```ts
 * import { getLocale } from 'yapyak';
 *
 * getLocale(); // => 'sv'
 * ```
 */
export function getLocale(): Locale {
  if (!hasWarnedUninitialized && LOCALES.length === 0) {
    hasWarnedUninitialized = true;
    warn(
      'yapyak runtime not initialized — register the build-tool plugin (@yapyak/vite) in your bundler config.',
      { code: 'YPK_RUNTIME_NOT_INITIALIZED' },
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
 * Warns and no-ops if `value` is not in {@link locales}. Behavior beyond validation depends on the configured persistence:
 *
 * - `'none'` — Updates the in-memory locale and notifies subscribers.
 * - `'cookie'` (client) — Writes `document.cookie`, updates the in-memory locale, and notifies subscribers.
 * - `'cookie'` (server) — Appends a `Set-Cookie` header via the bound response writer (or warns if no writer is bound). Does not update the in-memory locale and does not notify subscribers — the cookie reaches the next request, not this one's render.
 * - `'local-storage'` (client) — Writes to `localStorage`, updates the in-memory locale, and notifies subscribers.
 * - `'local-storage'` (server) — Warns and no-ops; `localStorage` is browser-only.
 * - `'url'` (any environment) — Warns and no-ops. The URL is the source of truth — drive locale switches through router navigation.
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
    warn('setLocale ignored — value not in configured locales.', {
      code: 'YPK_SET_LOCALE_IGNORED',
      configured: LOCALES,
      requested: value,
    });
    return;
  }

  const shouldApplyInMemory = persistence?.set(value) ?? true;
  if (!shouldApplyInMemory) {
    return;
  }

  applyLocale(value);
}

/** The configured locales, frozen at module load from values injected by yapyak's compiler. */
export const locales: Locale[] = Object.freeze([...LOCALES]) as Locale[];

/** The default locale. Build-time constant. Inlined by yapyak's compiler. */
export const defaultLocale: Locale = DEFAULT_LOCALE;

export function subscribeLocale(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return (): void => {
    listeners.delete(fn);
  };
}

export function autoSubscribeLocale(
  meta: ImportMeta,
  fn: (locale: Locale) => void,
): void {
  const unsubscribe = subscribeLocale(fn);
  registerHotDispose(meta, unsubscribe);
}

export function resetLocale(): void {
  currentLocale = getInitialLocale();
  hasWarnedUninitialized = false;
}
