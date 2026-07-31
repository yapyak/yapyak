import { parseAcceptLanguage } from './accept-language';
import { findCanonicalLocale } from './canonical';
import { getLocaleFallbackChain } from './fallback-chain';

export type ResolveLocaleOptions = {
  acceptLanguage?: string;
};

export function resolveLocale(
  defaultLocale: string,
  locales: string[],
  options?: ResolveLocaleOptions,
): string {
  const acceptLanguage = options?.acceptLanguage;
  if (acceptLanguage === undefined) {
    return defaultLocale;
  }
  const candidates = parseAcceptLanguage(acceptLanguage);
  for (const candidate of candidates) {
    for (const subtag of getLocaleFallbackChain(candidate)) {
      const match = findCanonicalLocale(subtag, locales);
      if (match !== undefined) {
        return match;
      }
    }
    const match = findLikelyLocale(candidate, locales);
    if (match !== undefined) {
      return match;
    }
  }
  return defaultLocale;
}

function findLikelyLocale(
  candidate: string,
  locales: string[],
): string | undefined {
  const maximized = toMaximizedKey(candidate);
  if (maximized === undefined) {
    return undefined;
  }
  for (const subtag of getLocaleFallbackChain(maximized)) {
    const match =
      findCanonicalLocale(subtag, locales) ??
      findMaximizedLocale(subtag, locales);
    if (match !== undefined) {
      return match;
    }
  }
  return undefined;
}

function toMaximizedKey(locale: string): string | undefined {
  try {
    return new Intl.Locale(locale).maximize().toString().toLowerCase();
  } catch {
    return undefined;
  }
}

function findMaximizedLocale(
  candidate: string,
  locales: string[],
): string | undefined {
  const target = toMaximizedKey(candidate);
  if (target === undefined) {
    return undefined;
  }
  for (const locale of locales) {
    if (toMaximizedKey(locale) === target) {
      return locale;
    }
  }
  return undefined;
}
