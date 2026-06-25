import type { Locale } from './locale';
import type { NormalizedPersistenceConfig } from './persistence';

export type RuntimeMock = {
  defaultLocale: Locale;
  detectUserLocale: boolean;
  locales: Locale[];
  persistence: NormalizedPersistenceConfig;
  syncHtmlLang: boolean;
};

export function buildRuntimeMock(runtime: Partial<RuntimeMock> = {}): {
  // biome-ignore-start lint/style/useNamingConvention: yap yap yap
  DEFAULT_LOCALE: Locale;
  DETECT_USER_LOCALE: boolean;
  LOCALES: Locale[];
  PERSISTENCE_CONFIG: NormalizedPersistenceConfig;
  SYNC_HTML_LANG: boolean;
  // biome-ignore-end lint/style/useNamingConvention: yap yap yap
} {
  const {
    defaultLocale = 'en',
    detectUserLocale = false,
    locales = [
      'en',
      'sv',
    ],
    persistence = {
      type: 'none',
    },
    syncHtmlLang = false,
  } = runtime;
  return {
    DEFAULT_LOCALE: defaultLocale,
    DETECT_USER_LOCALE: detectUserLocale,
    LOCALES: locales.includes(defaultLocale)
      ? locales
      : [
          defaultLocale,
          ...locales,
        ],
    PERSISTENCE_CONFIG: persistence,
    SYNC_HTML_LANG: syncHtmlLang,
  };
}
