import type { FilterPattern } from 'vite';
import type { NormalizedPersistence } from '../persistence';
import type { Translator } from '../translator';

import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE } from '../parser';

/** Options for the {@link yapyak} Vite plugin. */
export interface YapyakOptions {
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
  exclude?: FilterPattern;
  /** The glob patterns to include for extraction. */
  include?: FilterPattern;
  /**
   * The directory for locale JSON files, relative to the project root.
   *
   * @defaultValue `'locales'`
   */
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
   * Whether to preserve existing translations when a `$t()` call is renamed in place.
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

interface NormalizedOptions {
  defaultLocale: string | undefined;
  detectAcceptLanguage: boolean;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  persistence: NormalizedPersistence;
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
    detectAcceptLanguage: options.detectAcceptLanguage ?? false,
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
