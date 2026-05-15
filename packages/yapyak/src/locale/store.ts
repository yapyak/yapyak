import { createPersistence, parseCookie } from '../persistence/index.ts';
import { detectLocale } from './detect.ts';
import { loadLocaleData } from './loader.ts';
import {
  ACCEPT_LANGUAGE,
  DEFAULT_LOCALE,
  LOCALES,
  PERSISTENCE,
  SYNC_HTML_LANG,
} from 'virtual:yapyak';

export interface RequestContext {
  acceptLanguage: string | undefined;
  cookieHeader: string | undefined;
  locale: string;
}

type RequestContextReader = () => RequestContext | undefined;

let requestContextReader: RequestContextReader | null = null;

/** @internal */
export function registerRequestContextReader(
  reader: RequestContextReader,
): void {
  requestContextReader = reader;
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
let version = 0;
let snapshot = `${currentLocale}#${version}`;
const listeners = new Set<() => void>();

if (SYNC_HTML_LANG && typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale;
}

/** Returns the current locale. */
export function getLocale(): string {
  if (typeof window === 'undefined' && requestContextReader !== null) {
    const ctx = requestContextReader();
    if (ctx !== undefined) {
      return ctx.locale;
    }
  }
  return currentLocale;
}

/**
 * Switches the active locale.
 *
 * Loads the locale's translations if not already cached, then notifies
 * framework integrations to re-render. No-op if the locale is not in the
 * configured `locales` list.
 *
 * @param locale - The locale to switch to.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!LOCALES.includes(locale)) {
    return;
  }
  if (locale === currentLocale) {
    return;
  }
  await loadLocaleData(locale);
  currentLocale = locale;
  version++;
  snapshot = `${currentLocale}#${version}`;
  persistence?.set(locale);
  if (SYNC_HTML_LANG && typeof document !== 'undefined') {
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
export function resolveLocaleFromHeaders(
  acceptLanguage: string | undefined,
  cookieHeader: string | undefined,
): string {
  const cookieName = PERSISTENCE?.type === 'cookie' ? PERSISTENCE.name : null;
  const persisted =
    cookieName !== null ? readCookieValue(cookieHeader, cookieName) : undefined;
  return detectLocale({
    acceptLanguage: ACCEPT_LANGUAGE ? acceptLanguage : undefined,
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES,
    persisted,
  });
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

/** @internal */
export function getLocaleSnapshot(): string {
  if (
    typeof window === 'undefined' &&
    requestContextReader !== null &&
    requestContextReader() !== undefined
  ) {
    return getLocale();
  }
  return snapshot;
}
