import {
  DEFAULT_LOCALE,
  DETECT_ACCEPT_LANGUAGE,
  LOCALES,
  PERSISTENCE,
  SYNC_HTML_LANG,
} from '@yapyak/shared';

import { buildPersistence } from '../persistence';
import { readRequest } from './request-reader';
import { resolveLocale } from './resolve';

let hasWarnedUninitialized = false;

const persistence = buildPersistence(PERSISTENCE, LOCALES);
const URL_PERSISTENCE = PERSISTENCE?.type === 'url';
const COOKIE_PERSISTENCE = PERSISTENCE?.type === 'cookie';
const POLL_INTERVAL_MS = 1000;

function getInitialLocale(): string {
  const persisted = persistence?.get();
  if (persisted && LOCALES.includes(persisted)) {
    return persisted;
  }
  return DEFAULT_LOCALE;
}

let currentLocale = getInitialLocale();
const listeners = new Set<(locale: string) => void>();

if (SYNC_HTML_LANG && typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale;
}

function applyLocale(value: string): void {
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
  if (persisted && LOCALES.includes(persisted)) {
    applyLocale(persisted);
  }
}

function watchHistory(onChange: () => void): void {
  window.addEventListener('popstate', onChange);
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (
    ...args: Parameters<typeof window.history.pushState>
  ): void => {
    originalPushState(...args);
    onChange();
  };
  window.history.replaceState = (
    ...args: Parameters<typeof window.history.replaceState>
  ): void => {
    originalReplaceState(...args);
    onChange();
  };
}

function pollWhileVisible(onChange: () => void): void {
  let intervalId: number | undefined;
  const start = (): void => {
    intervalId ??= window.setInterval(onChange, POLL_INTERVAL_MS);
  };
  const stop = (): void => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };
  document.addEventListener('visibilitychange', (): void => {
    if (document.visibilityState === 'visible') {
      onChange();
      start();
    } else {
      stop();
    }
  });
  if (document.visibilityState === 'visible') {
    start();
  }
}

if (URL_PERSISTENCE && typeof window !== 'undefined') {
  watchHistory(syncFromPersistence);
}

if (COOKIE_PERSISTENCE && typeof window !== 'undefined') {
  const { cookieStore } = window as typeof window & {
    cookieStore?: EventTarget;
  };
  if (cookieStore) {
    cookieStore.addEventListener('change', syncFromPersistence);
  } else {
    watchHistory(syncFromPersistence);
    pollWhileVisible(syncFromPersistence);
  }
}

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
export function getLocale(): string {
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
      if (fromPersistence && LOCALES.includes(fromPersistence)) {
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
 * No-op if `value` is not in {@link locales}. Notifies subscribers.
 *
 * No-op with `persistence: 'url'` — the URL is the source of truth. Drive locale switches through router navigation; the in-memory locale syncs automatically on URL change.
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
export function setLocale(value: string): void {
  if (!LOCALES.includes(value)) {
    return;
  }

  if (URL_PERSISTENCE) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[yapyak] setLocale() is a no-op with persistence: "url". The URL is the source of truth — drive locale switches through router navigation.',
      );
    }
    return;
  }

  if (persistence?.set(value) === true) {
    return;
  }

  applyLocale(value);
}

/** The configured locales. Build-time constant. Inlined by yapyak's compiler. */
export const locales: readonly string[] = LOCALES;

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
