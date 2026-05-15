import { DEFAULT_LOCALE, LOADERS, LOCALES } from 'virtual:yapyak';

export type LocaleData = Record<string, Record<string, string>>;

const cache = new Map<string, LocaleData>();

export async function loadLocaleData(locale: string): Promise<LocaleData> {
  if (locale === DEFAULT_LOCALE) {
    return {};
  }
  const cached = cache.get(locale);
  if (cached !== undefined) {
    return cached;
  }
  const loader = LOADERS[locale];
  if (loader === undefined) {
    return {};
  }
  const mod = await loader();
  cache.set(locale, mod.default);
  return mod.default;
}

export function getCachedLocaleData(locale: string): LocaleData {
  return cache.get(locale) ?? {};
}

export async function loadLocale(locale: string): Promise<void> {
  if (!LOCALES.includes(locale)) {
    throw new Error(`yapyak: unknown locale "${locale}"`);
  }
  await loadLocaleData(locale);
}

/** @internal */
export function clearLocaleDataCache(): void {
  cache.clear();
}
