import { parseAcceptLanguage } from './accept-language';

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
    if (locales.includes(candidate)) {
      return candidate;
    }
    const prefix = candidate.split('-')[0];
    if (prefix && locales.includes(prefix)) {
      return prefix;
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
