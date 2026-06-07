import type { Persistence } from './type';

import { subscribeHistory } from './history';

export function getLocaleFromUrl(
  url: URL | Location,
  locales: string[],
  match?: RegExp,
): string | undefined {
  if (match) {
    const target = url.pathname + url.search + url.hash;
    const matched = match.exec(target);
    const captured = matched?.groups?.locale ?? matched?.[1];
    if (captured && locales.includes(captured)) {
      return captured;
    }
    return undefined;
  }
  const segment = url.pathname.split('/')[1];
  if (segment && locales.includes(segment)) {
    return segment;
  }
  return undefined;
}

interface UrlOptions {
  locales: string[];
  match?: RegExp;
}

export function url(options: UrlOptions): Persistence {
  const { locales, match } = options;
  return {
    get() {
      if (typeof window === 'undefined') {
        return undefined;
      }
      return getLocaleFromUrl(window.location, locales, match);
    },
    getFromRequest(request) {
      return getLocaleFromUrl(new URL(request.url), locales, match);
    },
    set() {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[yapyak] setLocale() is a no-op with persistence: "url". The URL is the source of truth — drive locale switches through router navigation.',
        );
      }
      return false;
    },
    subscribe(onChange) {
      if (typeof window === 'undefined') {
        return () => {};
      }
      return subscribeHistory(onChange);
    },
  };
}
