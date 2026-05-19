/** @internal */
export interface DetectOptions {
  acceptLanguage?: string;
  defaultLocale: string;
  locales: string[];
  navigatorLanguages?: string[];
  persisted?: string;
}

/** @internal */
export function detectLocale(options: DetectOptions): string {
  if (
    options.persisted !== undefined &&
    options.locales.includes(options.persisted)
  ) {
    return options.persisted;
  }
  const candidates = collectCandidates(options);
  for (const candidate of candidates) {
    if (options.locales.includes(candidate)) {
      return candidate;
    }
    const prefix = candidate.split('-')[0];
    if (prefix !== undefined && options.locales.includes(prefix)) {
      return prefix;
    }
  }
  return options.defaultLocale;
}

function collectCandidates(options: DetectOptions): string[] {
  if (options.acceptLanguage !== undefined) {
    return parseAcceptLanguage(options.acceptLanguage);
  }
  if (options.navigatorLanguages !== undefined) {
    return options.navigatorLanguages.map((language) => language.trim());
  }
  return [];
}

interface RankedCandidate {
  locale: string;
  quality: number;
}

/** @internal */
export function parseAcceptLanguage(header: string): string[] {
  if (header === '') {
    return [];
  }
  const ranked: RankedCandidate[] = [];
  for (const segment of header.split(',')) {
    const parts = segment.trim().split(';');
    const locale = parts[0]?.trim() ?? '';
    if (locale === '' || locale === '*') {
      continue;
    }
    let quality = 1;
    for (const param of parts.slice(1)) {
      const trimmed = param.trim();
      if (trimmed.startsWith('q=')) {
        const parsed = Number.parseFloat(trimmed.slice(2));
        if (Number.isFinite(parsed)) {
          quality = parsed;
        }
      }
    }
    if (quality > 0) {
      ranked.push({ locale, quality });
    }
  }
  ranked.sort((a, b) => b.quality - a.quality);
  return ranked.map((entry) => entry.locale);
}
