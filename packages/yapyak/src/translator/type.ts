import type { Locale } from '../locale';

/**
 * Call-site context for a translation request.
 *
 * Sent to translators and used as input to AI prompt building for tone-correct output. Renaming or removing fields is a breaking change.
 */
export interface MessageContext {
  /** The component name derived from the file path. */
  componentName: string;
  /** The nearest enclosing JSX/HTML element above the call. */
  enclosingElement: string | undefined;
  /** The surrounding code snippet, three lines above and below. */
  snippet: string;
}

/**
 * An example translation drawn from the project's existing locale files.
 *
 * @remarks
 * Passed to translators as style reference so the AI keeps terminology consistent with prior choices. yapyak collects these from the active locale files and the orphan cache; consumers do not construct them by hand.
 */
export interface TranslationExample {
  /** The source string from a prior call. */
  source: string;
  /** The translation that was chosen for it. */
  translation: string;
}

/**
 * Request shape for {@link Translator}.
 *
 * The fundamental input contract for every translator implementation. Renaming or removing fields is a breaking change.
 */
export interface TranslateRequest {
  /** The call-site context. */
  context?: MessageContext;
  /**
   * The developer-supplied disambiguation context.
   *
   * @remarks
   * Set via `t.as(context, source)` at the call site. Must not contain `'@'`.
   */
  disambiguation?: string;
  /** Example translations from the project, supplied as style reference. */
  examples?: TranslationExample[];
  /** The file path the source string came from. */
  fileId: string;
  /** The source string to translate. */
  source: string;
  /** The source locale. */
  sourceLocale: Locale;
  /** The target locale. */
  targetLocale: Locale;
}

/**
 * Translates source strings into target locales.
 *
 * @remarks
 * Returned by {@link createTranslator} and by the provider packages (`@yapyak/anthropic`, `@yapyak/openai`, `@yapyak/gemini`, `@yapyak/ollama`). Passed to yapyak's compiler via the `translator` option.
 *
 * Public extension point. Implemented by the provider packages and by third-party translators. Adding optional fields is allowed; renaming or removing fields is a breaking change.
 */
export interface Translator {
  /**
   * Translates a batch of requests.
   *
   * @param requests - The requests to translate.
   * @param options - The batch options.
   */
  batch?(
    requests: TranslateRequest[],
    options?: TranslateBatchOptions,
  ): Promise<string[]>;
  /**
   * The resolved context level for this translator.
   *
   * @remarks
   * Set by {@link createTranslator} from its `context` option. The compiler reads this field to align privacy-sensitive defaults — when set to `'none'`, the `examples` default falls to `0` so no prior translations leak alongside the source string. Custom translators that bypass {@link createTranslator} should set this field to match their effective context level.
   */
  context?: ContextLevel;
  /**
   * The stable identifier for this translator.
   *
   * @remarks
   * Convention: lowercase suffix matching the package name (`'anthropic'`, `'openai'`, `'gemini'`, `'ollama'`, `'cloud'`).
   */
  id: string;
  (request: TranslateRequest): Promise<string>;
}

/** Options for {@link Translator.batch}. */
export interface TranslateBatchOptions {
  /** Called when a chunk resolves. */
  onChunk?: (count: number) => void;
}

/**
 * The context level. Determines how much call-site context is passed to the translator.
 *
 * - `'none'` — sends the source string only.
 * - `'minimal'` — sends the source string, the component name, and the enclosing element.
 * - `'rich'` — sends the source string, the component name, the enclosing element, and the surrounding code snippet.
 *
 * @remarks
 * Selecting `'none'` keeps the calling code from leaving the project. The compiler reads the resolved level off {@link Translator.context} and aligns privacy-sensitive defaults — at `'none'`, the `examples` setting also resolves to `0`.
 *
 * @example
 * ```ts
 * function buildTranslator(level: ContextLevel) {
 *   return createTranslator({ context: level, translate: ... });
 * }
 * ```
 */
export type ContextLevel = 'none' | 'minimal' | 'rich';

/** An item in a translate batch. */
export interface TranslateItem {
  /** The component name derived from the file path. */
  component?: string;
  /** The developer-supplied disambiguation context. Set via `t.as(context, source)` at the call site. */
  disambiguation?: string;
  /** The nearest enclosing JSX/HTML element. */
  element?: string;
  /** Example translations from the project, supplied as style reference. */
  examples?: TranslationExample[];
  /** The surrounding code snippet (only with `context: 'rich'`). */
  snippet?: string;
  /** The source string to translate. */
  source: string;
}

/**
 * The translations for one input item, keyed by target locale.
 *
 * @remarks
 * Keys match `targetLocales` from the request. Each value is the translated string. The `translate` callback returns one of these per input item.
 */
export type LocaleTranslations = Record<string, string>;

/**
 * Request shape for the `translate` callback.
 *
 * @remarks
 * `items`, `sourceLocale`, and `targetLocales` are always present. The callback returns one {@link LocaleTranslations} per item, with a key per locale in `targetLocales`. The `signal` field forwards cancellation through to the underlying fetch/SDK call.
 *
 * @example Custom translate callback wired to a fetch endpoint
 * ```ts
 * import { createTranslator } from 'yapyak/translator';
 * import type { TranslateBatchRequest } from 'yapyak/translator';
 *
 * async function myTranslate(params: TranslateBatchRequest) {
 *   const response = await fetch('https://api.example/translate', {
 *     method: 'POST',
 *     body: JSON.stringify(params),
 *     signal: params.signal,
 *   });
 *   const { translations } = await response.json();
 *   return translations;
 * }
 *
 * createTranslator({ translate: myTranslate });
 * ```
 */
export interface TranslateBatchRequest {
  /**
   * The items to translate.
   *
   * @remarks
   * Each item's result must include a translation for every locale in `targetLocales`.
   */
  items: TranslateItem[];
  /**
   * The abort signal for cancellation.
   *
   * @remarks
   * Forwarded to the underlying fetch/SDK call.
   */
  signal?: AbortSignal;
  /** The source locale. */
  sourceLocale: Locale;
  /** The target locales required in every item's result. */
  targetLocales: Locale[];
}

/** Options for {@link createTranslator}. */
export interface CreateTranslatorInput {
  /**
   * The maximum number of items per `translate` call.
   *
   * @defaultValue `25`
   */
  batchSize?: number;
  /**
   * The maximum number of `translate` calls running in parallel.
   *
   * @defaultValue `5`
   */
  concurrency?: number;
  /**
   * How much call-site context to include.
   *
   * @defaultValue `'minimal'`
   */
  context?: ContextLevel;
  /**
   * Stable identifier for the translator. Surfaced as {@link Translator.id} and used for logging, cost attribution, and dashboard observability.
   *
   * @defaultValue `'custom'`
   */
  id?: string;
  /**
   * Translates a batch of items into every target locale.
   *
   * @remarks
   * Must return one {@link LocaleTranslations} per item, in the same order as `items`.
   */
  translate: (
    params: TranslateBatchRequest,
  ) => LocaleTranslations[] | Promise<LocaleTranslations[]>;
}
