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
  /** The developer-supplied disambiguation context. Set via `t.at(context, source)` at the call site. Matches `[a-z][a-z0-9-]*`. */
  disambiguation?: string;
  /** Example translations from the project, supplied as style reference. */
  examples?: TranslationExample[];
  /** The file path the source string came from. */
  fileId: string;
  /** The source string to translate. */
  source: string;
  /** The source locale. */
  sourceLocale: string;
  /** The target locale. */
  targetLocale: string;
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
  /** Stable identifier for this translator. Convention: lowercase suffix matching the package name (`'anthropic'`, `'openai'`, `'gemini'`, `'ollama'`, `'cloud'`). */
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
 * Choose `'none'` when nothing about the calling code may leave the project. The compiler reads the resolved level off {@link Translator.context} and aligns privacy-sensitive defaults — at `'none'`, the `examples` setting also defaults to `0`.
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
  /** The developer-supplied disambiguation context. Set via `t.at(context, source)` at the call site. */
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
 * Request shape for the `translate` callback.
 *
 * @remarks
 * `items`, `sourceLocale`, and `targetLocale` are always present. Forward `signal` to the underlying fetch/SDK call to honor cancellation.
 *
 * @example
 * ```ts
 * async function myTranslate(params: TranslateBatchRequest): Promise<string[]> {
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
  /** The items to translate. Translations must be returned in the same order. */
  items: TranslateItem[];
  /** The abort signal for cancellation. Forwarded to the underlying fetch/SDK call. */
  signal?: AbortSignal;
  /** The source locale. */
  sourceLocale: string;
  /** The target locale. */
  targetLocale: string;
}

/** Options for {@link createTranslator}. */
export interface CreateTranslatorOptions {
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
  /** Translates a batch of items. Must return strings in the same order as `items`. */
  translate: (params: TranslateBatchRequest) => string[] | Promise<string[]>;
}
