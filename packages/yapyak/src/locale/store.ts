import type { Locale } from './type';

import {
  DEFAULT_LOCALE,
  DETECT_ACCEPT_LANGUAGE,
  LOCALES,
  PERSISTENCE_CONFIG,
  SYNC_HTML_LANG,
} from 'yapyak/runtime';

import { warnDiagnostic } from '../diagnostic';
import { registerHotDispose } from '../hot-dispose';
import { buildPersistence } from '../persistence';
import { readRequest } from './request';
import { resolveLocale } from './resolve';

let hasWarnedUninitialized = false;
let hasWarnedSsrFallback = false;

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

/**
 * Parses a string into a {@link Locale}, normalizing tag casing.
 *
 * @param value - The candidate string.
 * @returns The matching configured {@link Locale}, or `undefined` when the value
 *   is not a recognized locale tag for this app.
 *
 * @remarks
 * Useful for trusting unknown input — URL params, cookies, HTTP headers — where
 * runtime values bypass the {@link Locale} type's compile-time guarantee. Tries
 * the input verbatim first; on miss, normalizes via {@link Intl.Locale} (BCP 47
 * canonical form) and retries. Returns `undefined` for malformed tags and for
 * well-formed tags that are not in the configured {@link locales} list.
 *
 * @example Narrow a URL parameter to Locale
 * ```ts
 * import { parseLocale } from 'yapyak';
 *
 * const locale = parseLocale(params.locale);
 * if (locale) {
 *   // locale is now typed as Locale
 * }
 * ```
 */
export function parseLocale(value: string): Locale | undefined {
  if (isLocale(value)) {
    return value;
  }
  try {
    const canonical = new Intl.Locale(value).toString();
    if (isLocale(canonical)) {
      return canonical;
    }
  } catch {}
  return undefined;
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

function writeLocale(value: Locale): void {
  if (value === currentLocale) {
    return;
  }
  currentLocale = value;
  if (SYNC_HTML_LANG && typeof document !== 'undefined') {
    document.documentElement.lang = value;
  }
  for (const listener of listeners) {
    try {
      listener(value);
    } catch (cause) {
      warnDiagnostic('LOCALE_LISTENER_THREW', undefined, {
        cause,
      });
    }
  }
}

function syncFromPersistence(): void {
  const persisted = persistence?.get();
  if (persisted !== undefined && isLocale(persisted)) {
    writeLocale(persisted);
  }
}

persistence?.subscribe?.(syncFromPersistence);

/**
 * The current locale.
 *
 * @remarks
 * Server-side, reads from the request bound by {@link withResponse} via persistence or the `Accept-Language` header. When no request is bound (e.g. outside any host-integration middleware), falls through to the module-scope locale shared across requests — the same value {@link setLocale} writes — which can leak between concurrent requests. A `YAP0022` warning fires once on the first such fallback. Client-side, returns the locale set by {@link setLocale}.
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
    warnDiagnostic('RUNTIME_NOT_INITIALIZED', undefined);
  }
  if (typeof window === 'undefined') {
    const request = readRequest();
    if (request) {
      const fromPersistence = persistence?.getFromRequest?.(request);
      if (fromPersistence !== undefined && isLocale(fromPersistence)) {
        return fromPersistence;
      }
      if (DETECT_ACCEPT_LANGUAGE) {
        const resolved = resolveLocale(DEFAULT_LOCALE, LOCALES, {
          acceptLanguage: request.headers.get('accept-language') ?? undefined,
        });
        return isLocale(resolved) ? resolved : DEFAULT_LOCALE;
      }
      return DEFAULT_LOCALE;
    }
    if (!hasWarnedSsrFallback) {
      hasWarnedSsrFallback = true;
      warnDiagnostic('RUNTIME_SSR_LEAK_RISK', undefined);
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
 * - `'none'` (client) — Updates the in-memory locale and notifies subscribers.
 * - `'none'` (server) — Warns with `YAP0029` and no-ops; mutating the shared module-global locale would leak between concurrent requests.
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
    warnDiagnostic(
      'LOCALE_SET_IGNORED',
      {
        value,
      },
      {
        configured: LOCALES,
        requested: value,
      },
    );
    return;
  }

  const shouldApplyInMemory = persistence?.set(value) ?? true;
  if (!shouldApplyInMemory) {
    return;
  }

  if (typeof window === 'undefined') {
    warnDiagnostic('LOCALE_SET_SSR_LEAK_RISK', undefined, {
      requested: value,
    });
    return;
  }

  writeLocale(value);
}

/** The configured locales, frozen at module load from values injected by yapyak's compiler. */
export const locales: Locale[] = Object.freeze([
  ...LOCALES,
]) as Locale[];

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
  hasWarnedSsrFallback = false;
}
