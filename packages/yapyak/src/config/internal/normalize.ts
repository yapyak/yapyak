import type {
  NormalizedPersistenceConfig,
  PersistenceConfig,
} from '../../persistence';
import type { Processor } from '../../processor';
import type { FilterPattern, YapyakConfig } from '../type';
import type { NormalizedYapyakConfig } from './type';

import { vanillaProcessor } from '../../compiler';

const DEFAULT_AUTO_TRANSLATE_THRESHOLD = 20;
const DEFAULT_EXAMPLES = 5;
const DEFAULT_INCLUDE: FilterPattern = ['src'];
const DEFAULT_EXCLUDE = [
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',
  '**/*.stories.{ts,tsx,js,jsx}',
  '**/*.gen.{ts,tsx,js,jsx,mjs,cjs}',
  '**/*.d.ts',
];
const DEFAULT_LOCALES_DIR = 'locales';
const DEFAULT_COOKIE_NAME = 'locale';
const DEFAULT_STORAGE_KEY = 'locale';

export function normalizeYapyakConfig(
  config: YapyakConfig,
): NormalizedYapyakConfig {
  const processors = config.processors ?? [];
  return {
    autoTranslateThreshold:
      config.autoTranslateThreshold ?? DEFAULT_AUTO_TRANSLATE_THRESHOLD,
    defaultLocale: config.defaultLocale,
    detectAcceptLanguage: config.detectAcceptLanguage ?? false,
    examples: resolveExamples(config),
    exclude: config.exclude ?? DEFAULT_EXCLUDE,
    include: resolveIncludePatterns(
      config.include ?? DEFAULT_INCLUDE,
      processors,
    ),
    localesDir: config.localesDir ?? DEFAULT_LOCALES_DIR,
    persistence: normalizePersistenceConfig(config.persistence),
    preserveTranslationsOnRename:
      config.preserveTranslationsOnRename ?? !config.translator,
    processors,
    syncHtmlLang: config.syncHtmlLang ?? false,
    translator: config.translator,
  };
}

function resolveIncludePatterns(
  input: FilterPattern,
  processors: Processor[],
): FilterPattern {
  const extensions = collectExtensions(processors);
  if (input instanceof RegExp) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((entry) => expandEntry(entry, extensions));
  }
  return expandEntry(input, extensions);
}

function expandEntry(
  entry: string | RegExp,
  extensions: string[],
): string | RegExp {
  if (entry instanceof RegExp) {
    return entry;
  }
  if (isGlobPattern(entry)) {
    return entry;
  }
  const trimmed = entry.replace(/\/+$/, '');
  return `${trimmed}/**/*.{${extensions.join(',')}}`;
}

function isGlobPattern(pattern: string): boolean {
  return /[*?{[]/.test(pattern);
}

function collectExtensions(processors: Processor[]): string[] {
  const allExtensions = new Set<string>();
  for (const extension of vanillaProcessor.extensions) {
    allExtensions.add(extension.replace(/^\./, ''));
  }
  for (const processor of processors) {
    for (const extension of processor.extensions) {
      allExtensions.add(extension.replace(/^\./, ''));
    }
  }
  return [...allExtensions].sort();
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
  if (!config) {
    return { type: 'none' };
  }
  if (typeof config === 'string') {
    switch (config) {
      case 'cookie':
        return { name: DEFAULT_COOKIE_NAME, type: 'cookie' };
      case 'local-storage':
        return { key: DEFAULT_STORAGE_KEY, type: 'local-storage' };
      case 'url':
        return { type: 'url' };
      case 'none':
        return { type: 'none' };
    }
  }
  switch (config.type) {
    case 'cookie':
      return { name: config.name ?? DEFAULT_COOKIE_NAME, type: 'cookie' };
    case 'local-storage':
      return { key: config.key ?? DEFAULT_STORAGE_KEY, type: 'local-storage' };
    case 'url':
      return config.match
        ? { match: config.match, type: 'url' }
        : { type: 'url' };
    case 'none':
      return { type: 'none' };
  }
}
