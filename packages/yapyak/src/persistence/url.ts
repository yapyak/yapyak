import type { Persistence } from '.';

import { createPersistence } from '.';

function getLocaleFromUrl(
  url: URL | Location,
  locales: readonly string[],
  match?: RegExp,
): string | undefined {
  if (match !== undefined) {
    const target = url.pathname + url.search + url.hash;
    const m = match.exec(target);
    const captured = m?.groups?.locale ?? m?.[1];
    if (captured !== undefined && locales.includes(captured)) {
      return captured;
    }
    return undefined;
  }
  const segment = url.pathname.split('/')[1];
  if (segment !== undefined && segment !== '' && locales.includes(segment)) {
    return segment;
  }
  return undefined;
}

export interface UrlOptions {
  locales: readonly string[];
  match?: RegExp;
}

export function url(options: UrlOptions): Persistence {
  const { locales, match } = options;
  return createPersistence({
    get() {
      if (typeof window === 'undefined') {
        return undefined;
      }
      return getLocaleFromUrl(window.location, locales, match);
    },
    getFromRequest(request) {
      return getLocaleFromUrl(new URL(request.url), locales, match);
    },
    set() {},
  });
}

export { getLocaleFromUrl };
