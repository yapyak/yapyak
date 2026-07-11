import type { Persistence } from './type';

import { warnDiagnostic } from '../diagnostic';
import { subscribeHistory } from './history';

type UrlOptions = {
  match?: RegExp;
};

export function url(options: UrlOptions): Persistence {
  const { match } = options;
  const pattern = match ? stripGlobalFlag(match) : undefined;
  return {
    get() {
      if (typeof window === 'undefined') {
        return undefined;
      }
      return getCandidateFromUrl(window.location, pattern);
    },
    getFromRequest(request) {
      return getCandidateFromUrl(new URL(request.url), pattern);
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

function stripGlobalFlag(regex: RegExp): RegExp {
  if (!regex.global) {
    return regex;
  }
  return new RegExp(regex.source, regex.flags.replace('g', ''));
}

function getCandidateFromUrl(
  url: URL | Location,
  match?: RegExp,
): string | undefined {
  if (match) {
    const target = url.pathname + url.search + url.hash;
    const matched = match.exec(target);
    const captured = matched?.groups?.locale ?? matched?.[1];
    return captured || undefined;
  }
  const segment = url.pathname.split('/')[1];
  return segment || undefined;
}
