import type { Translator } from '../translators/types.js';

export type Persistence = 'cookie' | 'localStorage' | null;

export type FilterPattern =
  | string
  | RegExp
  | Array<string | RegExp>
  | null
  | undefined;

/** Options for the yapyak Vite plugin. */
export interface YapyakOptions {
  /** Detect locale from the `Accept-Language` header on the server. */
  acceptLanguage?: boolean | undefined;
  /** Cookie name for locale persistence. Defaults to `'locale'`. */
  cookieName?: string | undefined;
  /** The default locale. Inferred from locale files if omitted. */
  defaultLocale?: string | undefined;
  /** Glob patterns to exclude from extraction. */
  exclude?: FilterPattern;
  /** Glob patterns to include for extraction. */
  include?: FilterPattern;
  /** Directory for locale JSON files, relative to project root. Defaults to `'locales'`. */
  localesDir?: string | undefined;
  /**
   * Take over `<html lang>` yourself. When `false` (default), yapyak keeps the
   * `lang` attribute on `document.documentElement` in sync with the current
   * locale. Set `true` if you manage the attribute manually (e.g. a yapyak
   * island on a multi-locale page).
   */
  manualHtmlLang?: boolean | undefined;
  /** Where to persist the user's locale selection. */
  persistence?: Persistence | undefined;
  /**
   * Preserve existing translations when a `t()` call is renamed in place.
   * Defaults to `true` without a translator, `false` with one.
   */
  preserveTranslationsOnRename?: boolean | undefined;
  /** localStorage key for locale persistence. Defaults to `'yapyak:locale'`. */
  storageKey?: string | undefined;
  /** Translator used to fill missing entries. Stubs stay empty without one. */
  translator?: Translator | undefined;
}

export interface NormalizedOptions {
  acceptLanguage: boolean;
  cookieName: string;
  defaultLocale: string | undefined;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  manualHtmlLang: boolean;
  persistence: Persistence;
  preserveTranslationsOnRename: boolean;
  storageKey: string;
  translator: Translator | undefined;
}

export const DEFAULT_INCLUDE: string[] = [
  '**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts,svelte,vue}',
];

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

export function normalizeOptions(options: YapyakOptions): NormalizedOptions {
  return {
    acceptLanguage: options.acceptLanguage ?? false,
    cookieName: options.cookieName ?? 'locale',
    defaultLocale: options.defaultLocale,
    exclude: options.exclude ?? DEFAULT_EXCLUDE,
    include: options.include ?? DEFAULT_INCLUDE,
    localesDir: options.localesDir ?? 'locales',
    manualHtmlLang: options.manualHtmlLang ?? false,
    persistence: options.persistence ?? null,
    preserveTranslationsOnRename:
      options.preserveTranslationsOnRename ?? options.translator === undefined,
    storageKey: options.storageKey ?? 'yapyak:locale',
    translator: options.translator,
  };
}
