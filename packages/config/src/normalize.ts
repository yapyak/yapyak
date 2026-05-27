import type { NormalizedPersistence } from '@yapyak/runtime';
import type {
  NormalizedYapyakConfig,
  PersistenceOption,
  YapyakConfig,
} from './type';

const DEFAULT_AUTO_TRANSLATE_THRESHOLD = 20;
const DEFAULT_INCLUDE = ['**/*.{ts,tsx,jsx,js,vue,svelte,astro}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**'];
const DEFAULT_LOCALES_DIR = 'locales';
const DEFAULT_COOKIE_NAME = 'locale';
const DEFAULT_STORAGE_KEY = 'locale';

export function normalizeYapyakConfig(
  config: YapyakConfig,
): NormalizedYapyakConfig {
  return {
    autoTranslateThreshold:
      config.autoTranslateThreshold ?? DEFAULT_AUTO_TRANSLATE_THRESHOLD,
    defaultLocale: config.defaultLocale,
    detectAcceptLanguage: config.detectAcceptLanguage ?? false,
    exclude: config.exclude ?? DEFAULT_EXCLUDE,
    include: config.include ?? DEFAULT_INCLUDE,
    localesDir: config.localesDir ?? DEFAULT_LOCALES_DIR,
    persistence: normalizePersistence(config.persistence),
    preserveTranslationsOnRename:
      config.preserveTranslationsOnRename ?? !config.translator,
    syncHtmlLang: config.syncHtmlLang ?? false,
    translator: config.translator,
  };
}

function normalizePersistence(
  input: PersistenceOption | undefined,
): NormalizedPersistence {
  if (input == null) {
    return null;
  }
  if (typeof input === 'string') {
    if (input === 'cookie') {
      return { name: DEFAULT_COOKIE_NAME, type: 'cookie' };
    }
    if (input === 'localStorage') {
      return { key: DEFAULT_STORAGE_KEY, type: 'localStorage' };
    }
    return { type: 'url' };
  }
  if (input.type === 'cookie') {
    return { name: input.name ?? DEFAULT_COOKIE_NAME, type: 'cookie' };
  }
  if (input.type === 'localStorage') {
    return { key: input.key ?? DEFAULT_STORAGE_KEY, type: 'localStorage' };
  }
  if (input.match) {
    return { match: input.match, type: 'url' };
  }
  return { type: 'url' };
}
