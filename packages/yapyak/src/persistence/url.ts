import type { Persistence } from './type';

import { warnDiagnostic } from '../diagnostic';
import { subscribeHistory } from './history';

type UrlOptions = {
  locales: string[];
  match?: RegExp;
};

export function url(options: UrlOptions): Persistence {
  const { locales, match } = options;
  const pattern = match ? stripGlobalFlag(match) : undefined;
  return {
    get() {
      if (typeof window === 'undefined') {
        return undefined;
      }
      return getLocaleFromUrl(window.location, locales, pattern);
    },
    getFromRequest(request) {
      return getLocaleFromUrl(new URL(request.url), locales, pattern);
    },
    set() {
      warnDiagnostic('PERSISTENCE_URL_SKIPPED', undefined);
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

function getLocaleFromUrl(
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

function stripGlobalFlag(regex: RegExp): RegExp {
  if (!regex.global) {
    return regex;
  }
  return new RegExp(regex.source, regex.flags.replace('g', ''));
}
