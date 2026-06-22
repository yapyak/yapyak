import type { Locale } from '../locale';

/**
 * The message context.
 */
export type MessageContext = {
  /** The component name derived from the file path. */
  componentName: string;
  /** The nearest enclosing JSX/HTML element above the call. */
  enclosingElement: string | undefined;
  /** The surrounding code snippet. */
  snippet: string;
};

/**
 * An example translation.
 */
export type TranslationExample = {
  /** The source string. */
  source: string;
  /** The translation. */
  translation: string;
};

/**
 * Request shape for {@link Translator}.
 */
export type TranslateRequest = {
  /** The call-site context. */
  context?: MessageContext;
  /**
   * The developer-supplied disambiguation context.
   *
   * @remarks
   * Set via `t.as(context, source)` at the call site.
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
};

/**
 * Translates source strings into target locales.
 *
 * @remarks
 * Returned by {@link createTranslator}.
 */
export type Translator = {
  /**
   * Translates a batch of requests.
   *
   * @param requests - The requests.
   * @param options - The options.
   */
  batch?(
    requests: TranslateRequest[],
    options?: TranslateBatchOptions,
  ): Promise<string[]>;
  /**
   * The resolved context level.
   */
  context?: ContextLevel;
  /**
   * The stable identifier.
   *
   * @remarks
   * Convention: lowercase suffix matching the package name.
   */
  id: string;
  (request: TranslateRequest): Promise<string>;
};

/** Options for {@link Translator.batch}. */
export type TranslateBatchOptions = {
  /** Called when a chunk resolves. */
  onChunk?: (count: number) => void;
  /**
   * Called when a chunk resolves with its per-locale translations.
   *
   * @remarks
   * Fires before `onChunk`. The `result` array is aligned with `requests`.
   */
  onChunkComplete?: (
    requests: TranslateRequest[],
    result: LocaleTranslations[],
  ) => void;
  /**
   * Called when a chunk fails after retries.
   *
   * @remarks
   * Abort errors do not fire this callback; they propagate via `signal`.
   */
  onChunkError?: (error: unknown, requests: TranslateRequest[]) => void;
  /** The abort signal. */
  signal?: AbortSignal;
};

/**
 * The context level. Determines how much call-site context is passed to the translator.
 *
 * - `'none'` — sends the source string only.
 * - `'minimal'` — sends the source string, the component name, and the enclosing element.
 * - `'rich'` — sends the source string, the component name, the enclosing element, and the surrounding code snippet.
 */
export type ContextLevel = 'none' | 'minimal' | 'rich';

/** An item in a translate batch. */
export type TranslateItem = {
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
};

/**
 * The translations for one input item, keyed by target locale.
 */
export type LocaleTranslations = Record<string, string>;

/**
 * Request shape for the `translate` callback.
 */
export type TranslateBatchRequest = {
  /** The items to translate. */
  items: TranslateItem[];
  /** The abort signal. */
  signal?: AbortSignal;
  /** The source locale. */
  sourceLocale: Locale;
  /** The target locales. */
  targetLocales: Locale[];
};

/**
 * Translates a batch of items into every target locale.
 *
 * @remarks
 * Returns one item per input, in order.
 */
export type TranslateFn = (
  params: TranslateBatchRequest,
) => LocaleTranslations[] | Promise<LocaleTranslations[]>;

/** Input for {@link createTranslator}. */
export type CreateTranslatorInput = {
  /**
   * The maximum items per `translate` call.
   *
   * @defaultValue `25`
   */
  batchSize?: number;
  /**
   * The maximum parallel `translate` calls.
   *
   * @defaultValue `5`
   */
  concurrency?: number;
  /**
   * The call-site context level.
   *
   * @defaultValue `'minimal'`
   */
  context?: ContextLevel;
  /**
   * The stable identifier.
   *
   * @defaultValue `'custom'`
   */
  id?: string;
  /** The translate callback. */
  translate: TranslateFn;
};
