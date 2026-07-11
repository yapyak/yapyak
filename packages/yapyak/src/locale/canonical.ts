export function findCanonicalLocale<T extends string>(
  candidate: string,
  locales: T[],
): T | undefined {
  const target = toCanonicalKey(candidate);
  for (const locale of locales) {
    if (toCanonicalKey(locale) === target) {
      return locale;
    }
  }
  return undefined;
}

function toCanonicalKey(locale: string): string {
  try {
    return new Intl.Locale(locale).toString().toLowerCase();
  } catch {
    return locale.toLowerCase();
  }
}
