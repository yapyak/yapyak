import type { NormalizedPersistence } from '@yapyak/runtime';
import type { Translator } from '@yapyak/translator';
import type { YapyakFilterPattern } from './filter';
import type { Persistence } from './persistence';

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
   * The glob patterns to exclude from extraction.
   *
   * @defaultValue `['**\/node_modules/**', '**\/dist/**']`
   */
  exclude?: YapyakFilterPattern;
  /**
   * The glob patterns to include for extraction.
   *
   * @defaultValue `['**\/*.{ts,tsx,jsx,js,vue,svelte,astro}']`
   */
  include?: YapyakFilterPattern;
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
