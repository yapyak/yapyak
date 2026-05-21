import type { FilterPattern } from 'vite';
import type { NormalizedPersistence } from '../persistence';
import type { Translator } from '../translator';

import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE } from '../parser';

/** Options for the yapyak Vite plugin. */
export interface YapyakOptions {
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
   *
   * @example
   * ```ts
   * persistence: 'cookie'
   * persistence: 'localStorage'
   * persistence: { type: 'cookie', name: 'app:locale' }
   * persistence: { type: 'localStorage', key: 'app:locale' }
   * ```
   */
  persistence?:
    | 'cookie'
    | 'localStorage'
    | { name?: string; type: 'cookie' }
    | { key?: string; type: 'localStorage' }
    | null;
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
  /** Detect locale from the `Accept-Language` header on the server. */
  detectAcceptLanguage?: boolean;
  /** Translator used to fill missing entries. Stubs stay empty without one. */
  translator?: Translator;
}

interface NormalizedOptions {
  defaultLocale: string | undefined;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistence;
  detectAcceptLanguage: boolean;
  preserveTranslationsOnRename: boolean;
  syncHtmlLang: boolean;
  translator: Translator | undefined;
}

const DEFAULT_COOKIE_NAME = 'locale';
const DEFAULT_STORAGE_KEY = 'locale';

function normalizePersistence(
  input: YapyakOptions['persistence'],
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
    defaultLocale: options.defaultLocale,
    exclude: options.exclude ?? DEFAULT_EXCLUDE,
    include: options.include ?? DEFAULT_INCLUDE,
    localesDir: options.localesDir ?? 'locales',
    persistence: normalizePersistence(options.persistence),
    detectAcceptLanguage: options.detectAcceptLanguage ?? false,
    preserveTranslationsOnRename:
      options.preserveTranslationsOnRename ??
      options.translator === undefined,
    syncHtmlLang: options.syncHtmlLang ?? false,
    translator: options.translator,
  };
}
