import { buildPersistence } from '../persistence';
import { resolveLocale } from './resolve';
import {
  DEFAULT_LOCALE,
  DETECT_ACCEPT_LANGUAGE,
  LOCALES,
  PERSISTENCE,
  SYNC_HTML_LANG,
} from 'virtual:yapyak';

type RequestReader = () => Request | undefined;

let requestReader: RequestReader | null = null;

export function setRequestReader(reader: RequestReader): void {
  requestReader = reader;
}

const persistence = buildPersistence(PERSISTENCE, LOCALES);

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

/**
 * The current locale.
 *
 * @example Read the current locale
 * ```ts
 * import { getLocale } from '@yapyak/core';
 *
 * getLocale(); // => 'sv'
 * ```
 */
export function getLocale(): string {
  if (typeof window === 'undefined' && requestReader !== null) {
    const request = requestReader();
    if (request !== undefined) {
      const fromPersistence = persistence?.getFromRequest?.(request);
      if (fromPersistence !== undefined && LOCALES.includes(fromPersistence)) {
        return fromPersistence;
      }
      if (DETECT_ACCEPT_LANGUAGE) {
        return resolveLocale({
          acceptLanguage: request.headers.get('accept-language') ?? undefined,
          defaultLocale: DEFAULT_LOCALE,
          locales: LOCALES,
        });
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
 * No-op if `value` is not in {@link locales}. Notifies subscribers and framework adapters.
 *
 * With `persistence: 'url'`, locale changes are coupled to the URL. If the target URL differs from the current URL, `setLocale` falls back to a full-page navigation via `window.location.href`. Drive locale switches through your router's navigation API (e.g. `router.navigate(...)`) so the URL change happens via SPA navigation, then the route loader calls `setLocale` with the URL already matching — no reload.
 *
 * @param value - The locale to switch to.
 *
 * @example Switch to Swedish
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

  if (persistence?.set(value) === true) {
    return;
  }

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

/** The configured locales. Build-time constant. Inlined by yapyak's compiler. */
export const locales: string[] = LOCALES;

/** The default locale. Build-time constant. Inlined by yapyak's compiler. */
export const defaultLocale: string = DEFAULT_LOCALE;

export function subscribeLocale(fn: (locale: string) => void): () => void {
  listeners.add(fn);
  return (): void => {
    listeners.delete(fn);
  };
}

export function resetLocale(): void {
  currentLocale = getInitialLocale();
  listeners.clear();
}
