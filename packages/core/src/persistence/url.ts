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

function applyLocaleToUrl(
  url: URL | Location,
  locale: string,
  locales: readonly string[],
  match?: RegExp,
): string {
  const target = url.pathname + url.search + url.hash;
  if (match !== undefined) {
    const m = match.exec(target);
    if (m !== null) {
      const captured = m.groups?.locale ?? m[1];
      if (captured !== undefined) {
        const replacedMatch = m[0].replace(captured, locale);
        return target.replace(m[0], replacedMatch);
      }
    }
    return target;
  }
  const segments = url.pathname.split('/');
  const first = segments[1];
  if (first !== undefined && first !== '' && locales.includes(first)) {
    segments[1] = locale;
    return segments.join('/') + url.search + url.hash;
  }
  const prefix = url.pathname === '/' ? '' : url.pathname;
  return `/${locale}${prefix}${url.search}${url.hash}`;
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
    set(locale) {
      if (typeof window === 'undefined') {
        return;
      }
      const target = applyLocaleToUrl(window.location, locale, locales, match);
      const current =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      if (target !== current) {
        window.location.href = target;
        return true;
      }
    },
  });
}

export { applyLocaleToUrl, getLocaleFromUrl };
