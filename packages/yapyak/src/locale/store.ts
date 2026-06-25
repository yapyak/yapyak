import type { Locale } from './type';

import {
  DEFAULT_LOCALE,
  DETECT_USER_LOCALE,
  LOCALES,
  PERSISTENCE_CONFIG,
  SYNC_HTML_LANG,
} from 'yapyak/runtime';

import { warnDiagnostic } from '../diagnostic';
import { registerHotDispose } from '../hot-dispose';
import { buildPersistence } from '../persistence';
import { findCanonicalLocale } from './canonical';
import { readRequest } from './request';
import { resolveLocale } from './resolve';

let hasWarnedUninitialized = false;
let hasWarnedSsrFallback = false;

const persistence = buildPersistence(PERSISTENCE_CONFIG, LOCALES);

/**
 * Type guard for {@link Locale}.
 *
 * @param value - The candidate string.
 *
 * @example
 * ```ts
 * import { isLocale } from 'yapyak';
 *
 * isLocale('sv'); // output: true
 * isLocale('xx'); // output: false
 * ```
 */
export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value);
}

/**
 * Parses a string into a locale.
 *
 * @remarks
 * Normalizes via BCP 47 canonical form if an exact match fails.
 *
 * @param value - The candidate string.
 *
 * @example
 * ```ts
 * import { parseLocale } from 'yapyak';
 *
 * parseLocale('SV'); // output: 'sv'
 * parseLocale('invalid'); // output: undefined
 * ```
 *
 * @see [BCP 47](https://datatracker.ietf.org/doc/html/bcp47)
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
  if (persisted !== undefined) {
    const match = findCanonicalLocale(persisted, LOCALES);
    if (match !== undefined) {
      return match;
    }
  }
  if (DETECT_USER_LOCALE && typeof navigator !== 'undefined') {
    const resolved = resolveLocale(DEFAULT_LOCALE, LOCALES, {
      acceptLanguage: navigator.languages.join(','),
    });
    if (isLocale(resolved)) {
      return resolved;
    }
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
  if (persisted !== undefined) {
    const match = findCanonicalLocale(persisted, LOCALES);
    if (match !== undefined) {
      writeLocale(match);
    }
  }
}

persistence?.subscribe?.(syncFromPersistence);

/**
 * The current locale.
 *
 * @example
 * ```ts
 * import { getLocale } from 'yapyak';
 *
 * getLocale(); // output: 'sv'
 * ```
 *
 * @see {@link setLocale}
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
      if (fromPersistence !== undefined) {
        const match = findCanonicalLocale(fromPersistence, LOCALES);
        if (match !== undefined) {
          return match;
        }
      }
      if (DETECT_USER_LOCALE) {
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
 * @param value - The locale to switch to.
 *
 * @example
 * ```ts
 * import { setLocale } from 'yapyak';
 *
 * setLocale('sv');
 * ```
 *
 * @see {@link getLocale}
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

/** The configured locales. */
export const locales: Locale[] = Object.freeze([
  ...LOCALES,
]) as Locale[];

/** The default locale. */
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
