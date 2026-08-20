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

/** The filter pattern. */
export type FilterPattern = string | RegExp | (string | RegExp)[];

/** Configuration for yapyak. */
export type YapyakConfig = {
  /**
   * The auto-translate threshold for untranslated strings during dev.
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
   * Whether to detect the user's locale from the environment.
   *
   * @remarks
   * On the server, reads the `Accept-Language` request header. In the browser, reads `navigator.languages` at runtime initialization. Detection only runs when no persisted value is found.
   *
   * @defaultValue `false`
   */
  detectUserLocale?: boolean;
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
   * Whether to preserve existing translations when a source string is edited in place.
   *
   * @defaultValue `true` without a {@link Translator}, `false` with one
   */
  preserveTranslationsOnSourceEdit?: boolean;
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
   * Whether to keep the `<html>` element's `lang` and `dir` attributes synced with the active locale.
   *
   * @defaultValue `false`
   */
  syncHtmlAttributes?: boolean;
  /** The translator. */
  translator?: Translator;
};
