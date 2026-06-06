import { parseAcceptLanguage } from './accept-language';

interface ResolveLocaleOptions {
  acceptLanguage?: string;
  defaultLocale: string;
  locales: string[];
  navigatorLanguages?: string[];
  persisted?: string;
}

export function resolveLocale(options: ResolveLocaleOptions): string {
  if (options.persisted && options.locales.includes(options.persisted)) {
    return options.persisted;
  }
  const candidates = extractCandidates(options);
  for (const candidate of candidates) {
    if (options.locales.includes(candidate)) {
      return candidate;
    }
    const prefix = candidate.split('-')[0];
    if (prefix && options.locales.includes(prefix)) {
      return prefix;
    }
  }
  return options.defaultLocale;
}

function extractCandidates(options: ResolveLocaleOptions): string[] {
  if (options.acceptLanguage) {
    return parseAcceptLanguage(options.acceptLanguage);
  }
  if (options.navigatorLanguages) {
    return options.navigatorLanguages.map((language) => language.trim());
  }
  return [];
}
