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
export type FilterPattern = string | RegExp | (string | RegExp)[];

/** Configuration for yapyak. */
export type YapyakConfig = {
  /**
   * The maximum number of cumulative untranslated strings eligible for auto-translation during dev.
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
   * @defaultValue `'en'`
   */
  defaultLocale?: Locale;
  /**
   * Whether to detect locale from the `Accept-Language` header on the server.
   *
   * @defaultValue `false`
   */
  detectAcceptLanguage?: boolean;
  /**
   * The maximum number of prior translations passed to the translator as style reference per request.
   *
   * @remarks
   * `0` disables the feature.
   *
   * @defaultValue `5`, or `0` when the translator's `context` is `'none'`
   */
  examples?: number;
  /**
   * The patterns to exclude from extraction.
   *
   * @remarks
   * Directory shortcuts (no glob characters) expand to `<entry>/**\/*.{<extensions>}`. Setting the field replaces the default; spreading `DEFAULT_EXCLUDE` extends it.
   *
   * @defaultValue `['**\/*.{test,spec}.*', '**\/__tests__/**', '**\/*.{stories,gen}.{ts,tsx,js,jsx,mjs,cjs}', '**\/*.d.ts']`
   */
  exclude?: FilterPattern;
  /**
   * The patterns to include for extraction.
   *
   * @remarks
   * Directory shortcuts (no glob characters) expand to `<entry>/**\/*.{<extensions>}`. Setting the field replaces the default; spreading `DEFAULT_INCLUDE` extends it.
   *
   * @defaultValue `['src']`
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
   * The processors for framework-specific file formats.
   *
   * @remarks
   * Vanilla `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.cts`, `.cjs` are handled without registration.
   *
   * @defaultValue `[]`
   */
  processors?: Processor[];
  /**
   * Whether to keep `document.documentElement.lang` synced with the current locale.
   *
   * @defaultValue `false`
   */
  syncHtmlLang?: boolean;
  /** The translator used to fill missing entries. Stubs stay empty without one. */
  translator?: Translator;
};
