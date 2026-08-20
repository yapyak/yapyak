import type {
  NormalizedPersistenceConfig,
  PersistenceConfig,
} from '../persistence';
import type { Processor } from '../processor';
import type { Translator } from '../translator';
import type { FilterPattern, YapyakConfig } from './type';

import { vanillaProcessor } from '../processor/internal';

export type NormalizedYapyakConfig = {
  autoTranslateThreshold: number;
  defaultLocale: string;
  detectUserLocale: boolean;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistenceConfig;
  preserveTranslationsOnSourceEdit: boolean;
  processors: Processor[];
  syncHtmlLang: boolean;
  translator: Translator | undefined;
};

const DEFAULT_AUTO_TRANSLATE_THRESHOLD = 20;
const DEFAULT_LOCALE = 'en';
const DEFAULT_LOCALES_DIR = 'locales';
const DEFAULT_COOKIE_NAME = 'locale';
const DEFAULT_STORAGE_KEY = 'locale';

/**
 * The default include patterns.
 *
 * @example
 * ```ts
 * import { DEFAULT_INCLUDE, defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   include: [...DEFAULT_INCLUDE, 'app']
 * });
 * ```
 */
export const DEFAULT_INCLUDE: FilterPattern = [
  'src',
];

/**
 * The default exclude patterns.
 *
 * @example
 * ```ts
 * import { DEFAULT_EXCLUDE, defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   exclude: [...DEFAULT_EXCLUDE, 'legacy']
 * });
 * ```
 */
export const DEFAULT_EXCLUDE: FilterPattern = [
  '**/*.{test,spec}.*',
  '**/__tests__/**',
  '**/*.{stories,gen}.{ts,tsx,js,jsx,mjs,cjs}',
  '**/*.d.ts',
];

export function normalizeYapyakConfig(
  config: YapyakConfig,
): NormalizedYapyakConfig {
  const processors = config.processors ?? [];
  const autoTranslateThreshold =
    config.autoTranslateThreshold ?? DEFAULT_AUTO_TRANSLATE_THRESHOLD;
  if (!Number.isInteger(autoTranslateThreshold) || autoTranslateThreshold < 0) {
    throw new Error(
      `[yapyak] autoTranslateThreshold must be a non-negative integer, got ${String(autoTranslateThreshold)}.`,
    );
  }
  const defaultLocale = config.defaultLocale ?? DEFAULT_LOCALE;
  if (defaultLocale === '') {
    throw new Error('[yapyak] defaultLocale cannot be an empty string.');
  }
  const localesDir = config.localesDir ?? DEFAULT_LOCALES_DIR;
  if (localesDir === '') {
    throw new Error('[yapyak] localesDir cannot be an empty string.');
  }
  return {
    autoTranslateThreshold,
    defaultLocale,
    detectUserLocale: config.detectUserLocale ?? false,
    exclude: resolvePatterns(config.exclude ?? DEFAULT_EXCLUDE, processors),
    include: resolvePatterns(config.include ?? DEFAULT_INCLUDE, processors),
    localesDir,
    persistence: normalizePersistenceConfig(config.persistence),
    preserveTranslationsOnSourceEdit:
      config.preserveTranslationsOnSourceEdit ?? !config.translator,
    processors,
    syncHtmlLang: config.syncHtmlLang ?? false,
    translator: config.translator,
  };
}

function resolvePatterns(
  input: FilterPattern,
  processors: Processor[],
): FilterPattern {
  const extensions = resolveExtensions(processors);
  if (input instanceof RegExp) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((entry) => normalizeEntry(entry, extensions));
  }
  return normalizeEntry(input, extensions);
}

function normalizeEntry(
  entry: string | RegExp,
  extensions: string[],
): string | RegExp {
  if (entry instanceof RegExp) {
    return entry;
  }
  if (entry === '') {
    throw new Error(
      '[yapyak] include/exclude entry cannot be an empty string.',
    );
  }
  if (!isDirectoryShortcut(entry, extensions)) {
    return entry;
  }
  const trimmed = entry.replace(/\/+$/, '');
  return `${trimmed}/**/*.{${extensions.join(',')}}`;
}

function isDirectoryShortcut(pattern: string, extensions: string[]): boolean {
  if (/[*?{[]/.test(pattern)) {
    return false;
  }
  const lastSegment = pattern.split('/').pop() ?? pattern;
  for (const extension of extensions) {
    if (lastSegment.endsWith(`.${extension}`)) {
      return false;
    }
  }
  return true;
}

function resolveExtensions(processors: Processor[]): string[] {
  const allExtensions = new Set<string>();
  for (const extension of vanillaProcessor.extensions) {
    allExtensions.add(extension.replace(/^\./, ''));
  }
  for (const processor of processors) {
    for (const extension of processor.extensions) {
      allExtensions.add(extension.replace(/^\./, ''));
    }
  }
  return [
    ...allExtensions,
  ].sort();
}

function normalizePersistenceConfig(
  config: PersistenceConfig | undefined,
): NormalizedPersistenceConfig {
  if (!config) {
    return {
      type: 'none',
    };
  }
  if (typeof config === 'string') {
    switch (config) {
      case 'cookie':
        return {
          name: DEFAULT_COOKIE_NAME,
          secure: false,
          type: 'cookie',
        };
      case 'local-storage':
        return {
          key: DEFAULT_STORAGE_KEY,
          type: 'local-storage',
        };
      case 'url':
        return {
          type: 'url',
        };
      case 'none':
        return {
          type: 'none',
        };
      default: {
        const exhaustive: never = config;
        throw new Error(
          `[yapyak] unknown persistence strategy: ${String(exhaustive)}.`,
        );
      }
    }
  }
  switch (config.type) {
    case 'cookie':
      return {
        name: config.name ?? DEFAULT_COOKIE_NAME,
        secure: config.secure ?? false,
        type: 'cookie',
      };
    case 'local-storage':
      return {
        key: config.key ?? DEFAULT_STORAGE_KEY,
        type: 'local-storage',
      };
    case 'url':
      return config.match
        ? {
            match: config.match,
            type: 'url',
          }
        : {
            type: 'url',
          };
    case 'none':
      return {
        type: 'none',
      };
    default: {
      const exhaustive: never = config;
      throw new Error(
        `[yapyak] unknown persistence type: ${JSON.stringify(exhaustive)}.`,
      );
    }
  }
}
