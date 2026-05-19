import type { Translator } from '../translator';

/** Cookie persistence config. */
export interface CookiePersistence {
  /** Cookie name. Defaults to `'locale'`. */
  name?: string;
  type: 'cookie';
}

/** localStorage persistence config. */
export interface LocalStoragePersistence {
  /** Storage key. Defaults to `'locale'`. */
  key?: string;
  type: 'localStorage';
}

/**
 * Where to persist the user's locale selection.
 *
 * Use the string shorthand for defaults, or the object form to customize.
 *
 * @example
 * ```ts
 * persistence: 'cookie'
 * persistence: 'localStorage'
 * persistence: { type: 'cookie', name: 'app:locale' }
 * persistence: { type: 'localStorage', key: 'app:locale' }
 * ```
 */
export type Persistence =
  | 'cookie'
  | 'localStorage'
  | CookiePersistence
  | LocalStoragePersistence;

/** Normalized persistence config (internal). */
export type NormalizedPersistence =
  | { type: 'cookie'; name: string }
  | { type: 'localStorage'; key: string }
  | null;

export type FilterPattern =
  | string
  | RegExp
  | Array<string | RegExp>
  | null
  | undefined;

/** Options for the yapyak Vite plugin. */
export interface YapyakOptions {
  /** Detect locale from the `Accept-Language` header on the server. */
  acceptLanguage?: boolean;
  /** The default locale. Inferred from locale files if omitted. */
  defaultLocale?: string;
  /** Glob patterns to exclude from extraction. */
  exclude?: FilterPattern;
  /** Glob patterns to include for extraction. */
  include?: FilterPattern;
  /** Directory for locale JSON files, relative to project root. Defaults to `'locales'`. */
  localesDir?: string;
  /**
   * Where to persist the user's locale selection.
   *
   * Use the string shorthand (`'cookie'` or `'localStorage'`) for defaults,
   * or the object form (`{ type: 'cookie', name: '...' }`) to customize.
   * Omit for no persistence.
   */
  persistence?: Persistence | null;
  /**
   * Preserve existing translations when a `t()` call is renamed in place.
   * Defaults to `true` without a translator, `false` with one.
   */
  preserveTranslationsOnRename?: boolean;
  /**
   * Keep `document.documentElement.lang` synced with the current locale.
   *
   * Off by default. yapyak does not touch the DOM unless this is set to
   * `true`. Useful for SvelteKit/Astro/SPA setups where the `<html>` element
   * isn't owned by a reactive framework binding. See each adapter's docs.
   */
  syncHtmlLang?: boolean;
  /** Translator used to fill missing entries. Stubs stay empty without one. */
  translator?: Translator;
}

export interface NormalizedOptions {
  acceptLanguage: boolean;
  defaultLocale: string | undefined;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistence;
  preserveTranslationsOnRename: boolean;
  syncHtmlLang: boolean;
  translator: Translator | undefined;
}

/** @internal */
export const DEFAULT_INCLUDE: string[] = [
  '**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts,svelte,vue}',
];

/** @internal */
export const DEFAULT_EXCLUDE: string[] = [
  '**/.*/**',
  'node_modules/**',
  'dist/**',
  'build/**',
  'out/**',
  'coverage/**',
  'playwright-report/**',
  'test-results/**',
  'storybook-static/**',
  'public/**',
  '**/routeTree.gen.*',
  '**/*.gen.{ts,tsx,js,jsx,mjs,cjs}',
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',
  '**/cypress/**',
  '**/playwright/**',
  '**/e2e/**',
  '*.config.{ts,js,mjs,cjs}',
  '**/*.d.ts',
];

const DEFAULT_COOKIE_NAME = 'locale';
const DEFAULT_STORAGE_KEY = 'locale';

function normalizePersistence(
  input: Persistence | null | undefined,
): NormalizedPersistence {
  if (input == null) {
    return null;
  }
  if (typeof input === 'string') {
    if (input === 'cookie') {
      return { name: DEFAULT_COOKIE_NAME, type: 'cookie' };
    }
    return { key: DEFAULT_STORAGE_KEY, type: 'localStorage' };
  }
  if (input.type === 'cookie') {
    return { name: input.name ?? DEFAULT_COOKIE_NAME, type: 'cookie' };
  }
  return { key: input.key ?? DEFAULT_STORAGE_KEY, type: 'localStorage' };
}

export function normalizeOptions(options: YapyakOptions): NormalizedOptions {
  return {
    acceptLanguage: options.acceptLanguage ?? false,
    defaultLocale: options.defaultLocale,
    exclude: options.exclude ?? DEFAULT_EXCLUDE,
    include: options.include ?? DEFAULT_INCLUDE,
    localesDir: options.localesDir ?? 'locales',
    persistence: normalizePersistence(options.persistence),
    preserveTranslationsOnRename:
      options.preserveTranslationsOnRename ?? options.translator === undefined,
    syncHtmlLang: options.syncHtmlLang ?? false,
    translator: options.translator,
  };
}
