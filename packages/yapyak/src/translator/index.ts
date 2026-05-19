/** Call-site context for a translation request. */
export interface MessageContext {
  /** The component name derived from the file path. */
  componentName: string;
  /** The nearest enclosing JSX/HTML element above the call. */
  enclosingElement: string | undefined;
  /** The surrounding code snippet, three lines above and below. */
  snippet: string;
}

/** A single translation request. */
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
 * Pass to the Vite plugin's `translator` option. Use `createTranslator` to
 * build one — or the built-ins (`anthropic`, `openai`, `gemini`, `ollama`).
 */
export interface Translator {
  /** Translates a batch of requests. */
  batch?(requests: TranslateRequest[]): Promise<string[]>;
  (request: TranslateRequest): Promise<string>;
}

/**
 * How much call-site context to pass to the translate function.
 *
 * - `'none'` — source string only. Privacy-strict; nothing about your code leaves your project.
 * - `'minimal'` — source + component name + enclosing element. Default.
 * - `'rich'` — minimal plus the surrounding code snippet.
 *
 * @example
 * ```ts
 * function buildTranslator(level: ContextLevel) {
 *   return createTranslator({ context: level, translate: ... });
 * }
 * ```
 */
export type ContextLevel = 'none' | 'minimal' | 'rich';

/** A single item to translate. */
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
 * Parameters passed to a translator's `translate` function.
 *
 * `items`, `sourceLocale`, and `targetLocale` are always present. Forward
 * `signal` to your underlying fetch/SDK call to honor cancellation.
 *
 * @example
 * ```ts
 * async function myTranslate(params: TranslateParams): Promise<string[]> {
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
export interface TranslateParams {
  /** The items to translate. Translations must be returned in the same order. */
  items: TranslateItem[];
  /** Abort signal for cancellation. Forward to your underlying fetch/SDK call. */
  signal?: AbortSignal;
  /** The source locale. */
  sourceLocale: string;
  /** The target locale. */
  targetLocale: string;
}

/** Options for `createTranslator`. */
export interface CreateTranslatorOptions {
  /** Max number of items per `translate` call. Defaults to 10. */
  batchSize?: number;
  /** How much call-site context to include. Defaults to `'minimal'`. */
  context?: ContextLevel;
  /** Translates a batch of items. Must return strings in the same order as `items`. */
  translate: (params: TranslateParams) => string[] | Promise<string[]>;
}

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_CONTEXT: ContextLevel = 'minimal';

/**
 * Builds a translator from a `translate` function.
 *
 * Handles batching, context shaping, and result validation — you just provide
 * the function that talks to the AI.
 *
 * @param options - The translator options.
 * @returns A translator usable in the Vite plugin config.
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
  const contextLevel = options.context ?? DEFAULT_CONTEXT;

  async function runBatch(requests: TranslateRequest[]): Promise<string[]> {
    if (requests.length === 0) {
      return [];
    }
    const reference = requests[0];
    if (reference === undefined) {
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

  async function batch(requests: TranslateRequest[]): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      const chunk = requests.slice(i, i + batchSize);
      const chunkResult = await runBatch(chunk);
      results.push(...chunkResult);
    }
    return results;
  }

  async function single(request: TranslateRequest): Promise<string> {
    const [first] = await runBatch([request]);
    return first ?? '';
  }

  const translator = single as Translator;
  translator.batch = batch;
  return translator;
}

function toItem(request: TranslateRequest, level: ContextLevel): TranslateItem {
  const item: TranslateItem = { source: request.source };
  if (level === 'none') {
    return item;
  }
  const context = request.context;
  if (context !== undefined) {
    if (context.componentName !== '') {
      item.component = context.componentName;
    }
    if (context.enclosingElement !== undefined) {
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

export { anthropic } from './anthropic';
export { gemini } from './gemini';
export { ollama } from './ollama';
export { openai } from './openai';
