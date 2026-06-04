import type { Translator } from '../translator';

/** The cookie persistence configuration. */
export interface CookiePersistence {
  /**
   * The cookie name.
   *
   * @defaultValue `'locale'`
   */
  name?: string;
  type: 'cookie';
}

/** The localStorage persistence configuration. */
export interface LocalStoragePersistence {
  /**
   * The storage key.
   *
   * @defaultValue `'locale'`
   */
  key?: string;
  type: 'local-storage';
}

/** The URL persistence configuration. */
export interface UrlPersistence {
  /**
   * The pattern that matches the locale segment in the URL.
   *
   * @defaultValue `/^[/](?<locale>[^/]+)/`
   */
  match?: RegExp;
  type: 'url';
}

/** The locale persistence strategy. */
export type Persistence =
  | 'cookie'
  | 'local-storage'
  | 'url'
  | CookiePersistence
  | LocalStoragePersistence
  | UrlPersistence
  | null;

/** Glob pattern for include/exclude filtering. */
export type FilterPattern = string | RegExp | Array<string | RegExp>;

/** Configuration for yapyak. */
export interface YapyakConfig {
  /**
   * The maximum number of untranslated strings per save eligible for auto-translation.
   *
   * @remarks
   * `0` disables auto-translation.
   *
   * @defaultValue `20`
   */
  autoTranslateThreshold?: number;
  /**
   * The default locale.
   *
   * @defaultValue Inferred from `locales/*.json`; `'en'` when none exist
   */
  defaultLocale?: string;
  /**
   * Whether to detect locale from the `Accept-Language` header on the server.
   *
   * @defaultValue `false`
   */
  detectAcceptLanguage?: boolean;
  /**
   * The maximum number of prior project translations passed to the translator as style reference per request.
   *
   * @remarks
   * Drawn from the project's existing locale files and orphan cache, scoped to the same locale. Same-file entries rank first, then fuzzy similarity. `0` disables the feature entirely. Keep small — 5 matches Smartling's production default. When the configured translator's `context` is `'none'`, this defaults to `0` so no prior translations leak alongside the source string; set it explicitly to opt back in.
   *
   * @defaultValue `5`, or `0` when the translator's `context` is `'none'`
   */
  examples?: number;
  /**
   * The glob patterns to exclude from extraction.
   *
   * @defaultValue `['**\/node_modules/**', '**\/dist/**']`
   */
  exclude?: FilterPattern;
  /**
   * The glob patterns to include for extraction.
   *
   * @defaultValue `['**\/*.{ts,tsx,jsx,js,vue,svelte,astro}']`
   */
  include?: FilterPattern;
  /**
   * The directory for locale JSON files, relative to the project root.
   *
   * @defaultValue `'locales'`
   */
  localesDir?: string;
  /**
   * The locale persistence strategy.
   *
   * @defaultValue `null`
   */
  persistence?: Persistence;
  /**
   * Whether to preserve existing translations when a `t()` call is renamed in place.
   *
   * @defaultValue `true` without a {@link Translator}, `false` with one
   */
  preserveTranslationsOnRename?: boolean;
  /**
   * Whether to keep `document.documentElement.lang` synced with the current locale.
   *
   * @remarks
   * Without it, yapyak does not touch the DOM. Enable for SvelteKit, Astro, and SPA setups where the `<html>` element isn't owned by a reactive framework binding.
   *
   * @defaultValue `false`
   */
  syncHtmlLang?: boolean;
  /** The translator used to fill missing entries. Stubs stay empty without one. */
  translator?: Translator;
}
