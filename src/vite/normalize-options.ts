import type { Translator } from '../translators/types.js';

export type Persistence = 'cookie' | 'localStorage' | null;

export type FilterPattern =
  | string
  | RegExp
  | Array<string | RegExp>
  | null
  | undefined;

export interface YapyakOptions {
  acceptLanguage?: boolean | undefined;
  cookieName?: string | undefined;
  defaultLocale?: string | undefined;
  exclude?: FilterPattern;
  include?: FilterPattern;
  localesDir?: string | undefined;
  persistence?: Persistence | undefined;
  preserveTranslationsOnRename?: boolean | undefined;
  storageKey?: string | undefined;
  translator?: Translator | undefined;
}

export interface NormalizedOptions {
  acceptLanguage: boolean;
  cookieName: string;
  defaultLocale: string | undefined;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
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
    persistence: options.persistence ?? null,
    preserveTranslationsOnRename: options.preserveTranslationsOnRename ?? false,
    storageKey: options.storageKey ?? 'yapyak:locale',
    translator: options.translator,
  };
}
