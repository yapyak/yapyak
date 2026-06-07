import type { Locale } from '../locale';
import type { PersistenceConfig } from '../persistence';
import type { Processor } from '../processor';
import type { Translator } from '../translator';

export type {
  CookiePersistenceOptions,
  LocalStoragePersistenceOptions,
  NonePersistenceOptions,
  PersistenceConfig,
  UrlPersistenceOptions,
} from '../persistence';

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
  defaultLocale?: Locale;
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
   * Drawn from the project's existing locale files and orphan cache, scoped to the same locale. Same-file entries rank first, then fuzzy similarity. A value of `0` disables the feature entirely. The default tracks the translator's privacy posture so no prior translations leak alongside the source string when context is suppressed.
   *
   * @defaultValue `5`, or `0` when the translator's `context` is `'none'`
   */
  examples?: number;
  /**
   * The patterns to exclude from extraction.
   *
   * @remarks
   * Applied after {@link YapyakConfig.include}. The default covers files that legitimately live alongside source code but never contain real translation calls: tests, stories, generated code, and type declarations.
   *
   * @defaultValue `['**\/*.test.*', '**\/*.spec.*', '**\/__tests__/**', '**\/*.stories.{ts,tsx,js,jsx}', '**\/*.gen.{ts,tsx,js,jsx,mjs,cjs}', '**\/*.d.ts']`
   */
  exclude?: FilterPattern;
  /**
   * The patterns to include for extraction.
   *
   * @remarks
   * Each string entry is either a directory shortcut (no glob characters) or an explicit glob. Directory shortcuts expand to `<entry>/**\/*.{<extensions>}` using the extensions from `processors`. Explicit globs and `RegExp` entries pass through unchanged.
   *
   * @defaultValue `['src']`
   *
   * @example Directory shortcut, glob, and `RegExp` entries
   * ```ts
   * defineConfig({ include: ['src'] });                       // expands to 'src/**\/*.{ts,tsx,...}'
   * defineConfig({ include: ['src', 'app'] });                // multiple roots
   * defineConfig({ include: ['src/components/**\/*.tsx'] });  // explicit glob, used as-is
   * defineConfig({ include: [/\.svelte$/] });                 // RegExp, used as-is
   * ```
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
   * @defaultValue `'none'`
   */
  persistence?: PersistenceConfig;
  /**
   * Whether to preserve existing translations when a `t()` call is renamed in place.
   *
   * @defaultValue `true` without a {@link Translator}, `false` with one
   */
  preserveTranslationsOnRename?: boolean;
  /**
   * Processors for framework-specific file formats (`.vue`, `.svelte`, `.astro`, etc.).
   *
   * @remarks
   * Each processor handles a set of file extensions. Vanilla `.ts`/`.tsx`/`.js`/`.jsx` are handled by the built-in processor without registration. The shipped processor packages (`@yapyak/vue/processor`, `@yapyak/svelte/processor`, `@yapyak/astro/processor`) cover the listed frameworks; custom processors implement {@link Processor}.
   *
   * @defaultValue `[]`
   */
  processors?: Processor[];
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
