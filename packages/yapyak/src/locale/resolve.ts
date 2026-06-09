import { parseAcceptLanguage } from './accept-language';

interface ResolveLocaleInput {
  acceptLanguage?: string;
  defaultLocale: string;
  locales: string[];
  navigatorLanguages?: string[];
  persisted?: string;
}

export function resolveLocale(input: ResolveLocaleInput): string {
  if (
    input.persisted !== undefined &&
    input.locales.includes(input.persisted)
  ) {
    return input.persisted;
  }
  const candidates = extractCandidates(input);
  for (const candidate of candidates) {
    if (input.locales.includes(candidate)) {
      return candidate;
    }
    const prefix = candidate.split('-')[0];
    if (prefix && input.locales.includes(prefix)) {
      return prefix;
    }
  }
  return input.defaultLocale;
}

function extractCandidates(input: ResolveLocaleInput): string[] {
  if (input.acceptLanguage !== undefined) {
    return parseAcceptLanguage(input.acceptLanguage);
  }
  if (input.navigatorLanguages) {
    return input.navigatorLanguages.map((language) => language.trim());
  }
  return [];
}
