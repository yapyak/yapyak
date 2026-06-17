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
  }
  return defaultLocale;
}
