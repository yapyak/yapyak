import type {
  NormalizedPersistenceConfig,
  PersistenceConfig,
} from '../../persistence';
import type { YapyakConfig } from '../type';
import type { NormalizedYapyakConfig } from './type';

const DEFAULT_AUTO_TRANSLATE_THRESHOLD = 20;
const DEFAULT_EXAMPLES = 5;
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
    examples: resolveExamples(config),
    exclude: config.exclude ?? DEFAULT_EXCLUDE,
    include: config.include ?? DEFAULT_INCLUDE,
    localesDir: config.localesDir ?? DEFAULT_LOCALES_DIR,
    persistence: normalizePersistenceConfig(config.persistence),
    preserveTranslationsOnRename:
      config.preserveTranslationsOnRename ?? !config.translator,
    processors: config.processors ?? [],
    syncHtmlLang: config.syncHtmlLang ?? false,
    translator: config.translator,
  };
}

function resolveExamples(config: YapyakConfig): number {
  if (config.examples !== undefined) {
    return config.examples;
  }
  if (config.translator?.context === 'none') {
    return 0;
  }
  return DEFAULT_EXAMPLES;
}

function normalizePersistenceConfig(
  config: PersistenceConfig | undefined,
): NormalizedPersistenceConfig {
  if (config === undefined) {
    return { type: 'none' };
  }
  if (typeof config === 'string') {
    if (config === 'cookie') {
      return { name: DEFAULT_COOKIE_NAME, type: 'cookie' };
    }
    if (config === 'local-storage') {
      return { key: DEFAULT_STORAGE_KEY, type: 'local-storage' };
    }
    if (config === 'url') {
      return { type: 'url' };
    }
    return { type: 'none' };
  }
  if (config.type === 'cookie') {
    return { name: config.name ?? DEFAULT_COOKIE_NAME, type: 'cookie' };
  }
  if (config.type === 'local-storage') {
    return { key: config.key ?? DEFAULT_STORAGE_KEY, type: 'local-storage' };
  }
  if (config.match) {
    return { match: config.match, type: 'url' };
  }
  return { type: 'url' };
}
