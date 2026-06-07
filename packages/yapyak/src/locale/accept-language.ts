interface RankedCandidate {
  locale: string;
  quality: number;
}

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
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
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
