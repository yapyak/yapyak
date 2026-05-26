/**
 * Translator base for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/translator
 * # or
 * pnpm add @yapyak/translator
 * ```
 *
 * @packageDocumentation
 */

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
 * Request shape for {@link Translator}.
 *
 * The fundamental input contract for every translator implementation. Renaming or removing fields is a breaking change.
 */
export interface TranslateRequest {
  /** The call-site context. */
  context?: MessageContext;
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
  /** Translates a batch of requests. */
  batch?(
    requests: TranslateRequest[],
    options?: TranslateBatchOptions,
  ): Promise<string[]>;
  /** Stable identifier for this translator. Used for logging, cost attribution, cache-key namespacing, and dashboard observability. Convention: lowercase suffix matching the package name (`'anthropic'`, `'openai'`, `'gemini'`, `'ollama'`, `'cloud'`). `createTranslator()` without an explicit `id` defaults to `'custom'`. */
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
 * Choose `'none'` when nothing about the calling code may leave the project.
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
  /** The nearest enclosing JSX/HTML element. */
  element?: string;
  /** The surrounding code snippet (only with `context: 'rich'`). */
  snippet?: string;
  /** The source string to translate. */
  source: string;
}

/**
 * Request shape for the `translate` callback.
 *
 * @remarks
 * `items`, `sourceLocale`, and `targetLocale` are always present. Forward
 * `signal` to the underlying fetch/SDK call to honor cancellation.
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

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_CONTEXT: ContextLevel = 'minimal';
const DEFAULT_ID = 'custom';

/**
 * Builds a translator from a `translate` function.
 *
 * @remarks
 * Handles batching, context shaping, and result validation. The provided function talks to the AI.
 *
 * @param options - The translator options.
 *
 * @example
 * ```ts
 * const myTranslator = createTranslator({
 *   async translate({ items, sourceLocale, targetLocale }) {
 *     const response = await fetch('https://my-api.example/translate', {
 *       method: 'POST',
 *       body: JSON.stringify({ items, sourceLocale, targetLocale }),
 *     });
 *     const { translations } = await response.json();
 *     return translations;
 *   },
 * });
 * ```
 */
export function createTranslator(options: CreateTranslatorOptions): Translator {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error(
      `createTranslator: batchSize must be a positive integer, got ${String(batchSize)}.`,
    );
  }
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error(
      `createTranslator: concurrency must be a positive integer, got ${String(concurrency)}.`,
    );
  }
  const contextLevel = options.context ?? DEFAULT_CONTEXT;

  async function runBatch(requests: TranslateRequest[]): Promise<string[]> {
    if (requests.length === 0) {
      return [];
    }
    const reference = requests[0];
    if (!reference) {
      return [];
    }
    const items = requests.map((request) => toItem(request, contextLevel));
    const result = await options.translate({
      items,
      sourceLocale: reference.sourceLocale,
      targetLocale: reference.targetLocale,
    });
    return validateBatch(result, {
      items,
      sourceLocale: reference.sourceLocale,
      targetLocale: reference.targetLocale,
    });
  }

  async function batch(
    requests: TranslateRequest[],
    batchOptions?: TranslateBatchOptions,
  ): Promise<string[]> {
    const chunks: TranslateRequest[][] = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      chunks.push(requests.slice(i, i + batchSize));
    }
    if (chunks.length === 0) {
      return [];
    }
    const chunkResults: string[][] = new Array(chunks.length);
    let cursor = 0;
    async function worker(): Promise<void> {
      while (cursor < chunks.length) {
        const myIndex = cursor;
        cursor += 1;
        const chunk = chunks[myIndex];
        if (!chunk) {
          continue;
        }
        const result = await runBatch(chunk);
        chunkResults[myIndex] = result;
        batchOptions?.onChunk?.(result.length);
      }
    }
    const workerCount = Math.min(concurrency, chunks.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return chunkResults.flat();
  }

  async function single(request: TranslateRequest): Promise<string> {
    const [first] = await runBatch([request]);
    return first ?? '';
  }

  const translator = single as Translator;
  translator.id = options.id ?? DEFAULT_ID;
  translator.batch = batch;
  return translator;
}

function toItem(request: TranslateRequest, level: ContextLevel): TranslateItem {
  const item: TranslateItem = { source: request.source };
  if (level === 'none') {
    return item;
  }
  const context = request.context;
  if (context) {
    if (context.componentName !== '') {
      item.component = context.componentName;
    }
    if (context.enclosingElement) {
      item.element = context.enclosingElement;
    }
    if (level === 'rich' && context.snippet !== '') {
      item.snippet = context.snippet;
    }
  }
  return item;
}

interface BatchContext {
  items: TranslateItem[];
  sourceLocale: string;
  targetLocale: string;
}

function validateBatch(result: unknown, context: BatchContext): string[] {
  const expectedLength = context.items.length;
  const locales = `${context.sourceLocale} → ${context.targetLocale}`;
  const sources = context.items
    .map((item) => JSON.stringify(item.source))
    .join(', ');

  if (!Array.isArray(result)) {
    throw new Error(
      `translate (${locales}) must return an array of ${expectedLength} string${expectedLength === 1 ? '' : 's'}, got ${typeof result}.\n` +
        `Sources: ${sources}`,
    );
  }
  if (result.length !== expectedLength) {
    throw new Error(
      `translate (${locales}) returned ${result.length} item${result.length === 1 ? '' : 's'}, expected ${expectedLength}.\n` +
        `Sources: ${sources}`,
    );
  }
  const validated: string[] = [];
  for (let i = 0; i < result.length; i++) {
    const value = result[i];
    if (typeof value !== 'string') {
      const source = JSON.stringify(context.items[i]?.source ?? '');
      throw new Error(
        `translate (${locales}) item ${i} was not a string: ${preview(value)}.\n` +
          `Source: ${source}`,
      );
    }
    validated.push(value.trim());
  }
  return validated;
}

function preview(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    return text.length > 100 ? `${text.slice(0, 100)}…` : text;
  } catch {
    return String(value);
  }
}
