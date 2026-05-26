import type { NormalizedPersistence } from '@yapyak/runtime';
import type { Translator } from '@yapyak/translator';

/** Glob pattern for include/exclude filtering. */
export type YapyakFilterPattern = string | RegExp | Array<string | RegExp>;

/** The locale persistence strategy. */
export type PersistenceOption =
  | 'cookie'
  | 'localStorage'
  | 'url'
  | { name?: string; type: 'cookie' }
  | { key?: string; type: 'localStorage' }
  | { match?: RegExp; type: 'url' }
  | null;

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
   * @remarks
   * Inferred from locale files if omitted.
   */
  defaultLocale?: string;
  /** Whether to detect locale from the `Accept-Language` header on the server. */
  detectAcceptLanguage?: boolean;
  /** The glob patterns to exclude from extraction. */
  exclude?: YapyakFilterPattern;
  /** The glob patterns to include for extraction. */
  include?: YapyakFilterPattern;
  /**
   * The directory for locale JSON files, relative to the project root.
   *
   * @defaultValue `'locales'`
   */
  localesDir?: string;
  /** The locale persistence strategy. */
  persistence?: PersistenceOption;
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
   */
  syncHtmlLang?: boolean;
  /** The translator used to fill missing entries. Stubs stay empty without one. */
  translator?: Translator;
}

/** {@link YapyakConfig} with defaults applied. */
export interface NormalizedYapyakConfig {
  autoTranslateThreshold: number;
  defaultLocale: string | undefined;
  detectAcceptLanguage: boolean;
  exclude: YapyakFilterPattern;
  include: YapyakFilterPattern;
  localesDir: string;
  persistence: NormalizedPersistence;
  preserveTranslationsOnRename: boolean;
  syncHtmlLang: boolean;
  translator: Translator | undefined;
}
