import type {
  NormalizedPersistenceConfig,
  PersistenceConfig,
} from '../persistence';
import type { Processor } from '../processor';
import type { Translator } from '../translator';
import type { FilterPattern, YapyakConfig } from './type';

import { vanillaProcessor } from '../compiler/internal';

export type NormalizedYapyakConfig = {
  autoTranslateThreshold: number;
  defaultLocale: string;
  detectAcceptLanguage: boolean;
  examples: number;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistenceConfig;
  preserveTranslationsOnRename: boolean;
  processors: Processor[];
  syncHtmlLang: boolean;
  translator: Translator | undefined;
};

const DEFAULT_AUTO_TRANSLATE_THRESHOLD = 20;
const DEFAULT_EXAMPLES = 5;
const DEFAULT_LOCALE = 'en';
const DEFAULT_LOCALES_DIR = 'locales';
const DEFAULT_COOKIE_NAME = 'locale';
const DEFAULT_STORAGE_KEY = 'locale';

/**
 * The default include patterns.
 *
 * @remarks
 * Spreading this constant into a `defineConfig` call's `include` keeps yapyak's defaults and adds entries on top.
 *
 * @example Extend the default include list
 * ```ts
 * import { DEFAULT_INCLUDE, defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   include: [...DEFAULT_INCLUDE, 'app'],
 * });
 * ```
 */
export const DEFAULT_INCLUDE: FilterPattern = [
  'src',
];

/**
 * The default exclude patterns.
 *
 * @remarks
 * Spreading this constant into a `defineConfig` call's `exclude` keeps yapyak's defaults and adds entries on top. The default covers files that legitimately live alongside source code but never contain real translation calls: tests, stories, generated code, and type declarations.
 *
 * @example Extend the default exclude list
 * ```ts
 * import { DEFAULT_EXCLUDE, defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   exclude: [...DEFAULT_EXCLUDE, 'legacy'],
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
  assertNonEmptyString(defaultLocale, 'defaultLocale');
  const localesDir = config.localesDir ?? DEFAULT_LOCALES_DIR;
  assertNonEmptyString(localesDir, 'localesDir');
  return {
    autoTranslateThreshold,
    defaultLocale,
    detectAcceptLanguage: config.detectAcceptLanguage ?? false,
    examples: resolveExamples(config),
    exclude: resolvePatterns(config.exclude ?? DEFAULT_EXCLUDE, processors),
    include: resolvePatterns(config.include ?? DEFAULT_INCLUDE, processors),
    localesDir,
    persistence: normalizePersistenceConfig(config.persistence),
    preserveTranslationsOnRename:
      config.preserveTranslationsOnRename ?? !config.translator,
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

function resolveExamples(config: YapyakConfig): number {
  if (config.examples !== undefined) {
    if (!Number.isInteger(config.examples) || config.examples < 0) {
      throw new Error(
        `[yapyak] examples must be a non-negative integer, got ${String(config.examples)}.`,
      );
    }
    return config.examples;
  }
  if (config.translator?.context === 'none') {
    return 0;
  }
  return DEFAULT_EXAMPLES;
}

const PERSISTENCE_KINDS = [
  'cookie',
  'local-storage',
  'none',
  'url',
] as const;

function normalizePersistenceConfig(
  config: PersistenceConfig | undefined,
): NormalizedPersistenceConfig {
  if (!config) {
    return {
      type: 'none',
    };
  }
  if (typeof config === 'string') {
    assertKnownDiscriminator(config, PERSISTENCE_KINDS, 'persistence');
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
          `[yapyak] unreachable persistence kind: ${String(exhaustive)}`,
        );
      }
    }
  }
  assertKnownDiscriminator(config.type, PERSISTENCE_KINDS, 'persistence.type');
  switch (config.type) {
    case 'cookie': {
      if (config.name !== undefined) {
        assertNonEmptyString(config.name, 'persistence.name');
      }
      return {
        name: config.name ?? DEFAULT_COOKIE_NAME,
        secure: config.secure ?? false,
        type: 'cookie',
      };
    }
    case 'local-storage': {
      if (config.key !== undefined) {
        assertNonEmptyString(config.key, 'persistence.key');
      }
      return {
        key: config.key ?? DEFAULT_STORAGE_KEY,
        type: 'local-storage',
      };
    }
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
        `[yapyak] unreachable persistence kind: ${String(exhaustive)}`,
      );
    }
  }
}

function assertNonEmptyString(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`[yapyak] ${field} cannot be an empty string.`);
  }
}

function assertKnownDiscriminator<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): asserts value is T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    const allowedList = allowed.map((entry) => `"${entry}"`).join(', ');
    throw new Error(
      `[yapyak] ${field} must be one of ${allowedList}; got ${JSON.stringify(value)}.`,
    );
  }
}
