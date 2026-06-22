import type { Locale } from '../locale';

/**
 * The message context.
 */
export type MessageContext = {
  /** The component name. */
  componentName: string;
  /** The enclosing element. */
  enclosingElement: string | undefined;
  /** The code snippet. */
  snippet: string;
};

/**
 * The translation example.
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
  /** The disambiguation context. */
  disambiguation?: string;
  /** The style-reference examples. */
  examples?: TranslationExample[];
  /** The file path. */
  fileId: string;
  /** The source string. */
  source: string;
  /** The source locale. */
  sourceLocale: Locale;
  /** The target locale. */
  targetLocale: Locale;
};

/**
 * Translates source strings into target locales.
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
   * The call-site context level.
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

/** Options for {@link Translator}. */
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
 * - `'none'`: sends the source string only.
 * - `'minimal'`: sends the source string, the component name, and the enclosing element.
 * - `'rich'`: sends the source string, the component name, the enclosing element, and the surrounding code snippet.
 */
export type ContextLevel = 'none' | 'minimal' | 'rich';

/** An item in a translate batch. */
export type TranslateItem = {
  /** The component name. */
  component?: string;
  /** The disambiguation context. */
  disambiguation?: string;
  /** The enclosing element. */
  element?: string;
  /** The style-reference examples. */
  examples?: TranslationExample[];
  /** The code snippet. */
  snippet?: string;
  /** The source string. */
  source: string;
};

/**
 * The locale translations. Holds one translated string per target locale.
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
