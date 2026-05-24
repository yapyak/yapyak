import type { NormalizedPersistence } from '@yapyak/core';
import type { Translator } from '@yapyak/translator';
import type { FilterPattern } from 'vite';

import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE } from '@yapyak/compiler';

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
   * Shorthands: `'cookie'`, `'localStorage'`, `'url'`. Use the object form to customize. Omit for no persistence.
   *
   * `'url'` uses the URL as the source of truth: yapyak reads the locale from `window.location` (and from incoming Requests on the server via `@yapyak/adapter`). Drive locale switches through your router's navigation API — `setLocale` falls back to a full reload only when the target URL differs from the current URL.
   *
   * @example
   * ```ts
   * persistence: 'cookie'
   * persistence: 'localStorage'
   * persistence: 'url'
   * persistence: { type: 'cookie', name: 'app:locale' }
   * persistence: { type: 'localStorage', key: 'app:locale' }
   * persistence: { type: 'url' }
   * persistence: { type: 'url', match: /[?&]lang=(?<locale>[a-z]{2})/ }
   * ```
   */
  persistence?:
    | 'cookie'
    | 'localStorage'
    | 'url'
    | { name?: string; type: 'cookie' }
    | { key?: string; type: 'localStorage' }
    | { match?: RegExp; type: 'url' }
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
    if (input === 'localStorage') {
      return { key: DEFAULT_STORAGE_KEY, type: 'localStorage' };
    }
    return { type: 'url' };
  }
  if (input.type === 'cookie') {
    return { name: input.name ?? DEFAULT_COOKIE_NAME, type: 'cookie' };
  }
  if (input.type === 'localStorage') {
    return { key: input.key ?? DEFAULT_STORAGE_KEY, type: 'localStorage' };
  }
  if (input.match !== undefined) {
    return { match: input.match, type: 'url' };
  }
  return { type: 'url' };
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
