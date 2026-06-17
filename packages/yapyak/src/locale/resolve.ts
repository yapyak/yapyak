import { parseAcceptLanguage } from './accept-language';
import { getLocaleFallbackChain } from './fallback-chain';

export type ResolveLocaleOptions = {
  acceptLanguage?: string;
  navigatorLanguages?: string[];
  persisted?: string;
};

export function resolveLocale(
  defaultLocale: string,
  locales: string[],
  options?: ResolveLocaleOptions,
): string {
  const persisted = options?.persisted;
  if (persisted !== undefined && locales.includes(persisted)) {
    return persisted;
  }
  const candidates = extractCandidates(options);
  for (const candidate of candidates) {
    for (const subtag of getLocaleFallbackChain(candidate)) {
      if (locales.includes(subtag)) {
        return subtag;
      }
    }
  }
  return defaultLocale;
}

function extractCandidates(
  options: ResolveLocaleOptions | undefined,
): string[] {
  if (options?.acceptLanguage !== undefined) {
    return parseAcceptLanguage(options.acceptLanguage);
  }
  if (options?.navigatorLanguages) {
    return options.navigatorLanguages.map((language) => language.trim());
  }
  return [];
}
