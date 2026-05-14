import type { MessageContext, TranslateRequest, Translator } from './types.js';

/**
 * How much call-site context to pass to the translate function.
 *
 * - `'none'` — source string only.
 * - `'minimal'` — source + component name + enclosing element.
 * - `'rich'` — minimal plus the surrounding code snippet.
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

/** Parameters passed to a translator's `translate` function. */
export interface TranslateParams {
  /** The items to translate. Translations must be returned in the same order. */
  items: TranslateItem[];
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
  /** The source locale. */
  sourceLocale: string;
  /** The target locale. */
  targetLocale: string;
}

/** Options for `createTranslator`. */
export interface CreateTranslatorOptions {
  /** Max number of items per `translate` call. Defaults to 10. */
  batchSize?: number | undefined;
  /** How much call-site context to include. Defaults to `'minimal'`. */
  context?: ContextLevel | undefined;
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
export function createTranslator(
  options: CreateTranslatorOptions,
): Translator {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const contextLevel = options.context ?? DEFAULT_CONTEXT;

  async function runBatch(requests: TranslateRequest[]): Promise<string[]> {
    if (requests.length === 0) {
      return [];
    }
    const reference = requests[0];
    if (reference === undefined) {
      return [];
    }
    const result = await options.translate({
      items: requests.map((request) => toItem(request, contextLevel)),
      sourceLocale: reference.sourceLocale,
      targetLocale: reference.targetLocale,
    });
    return validateBatch(result, requests.length);
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

function toItem(
  request: TranslateRequest,
  level: ContextLevel,
): TranslateItem {
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

function validateBatch(result: unknown, expectedLength: number): string[] {
  if (!Array.isArray(result)) {
    throw new Error(
      `translate must return an array, got ${typeof result}`,
    );
  }
  if (result.length !== expectedLength) {
    throw new Error(
      `translate returned ${result.length} items, expected ${expectedLength}`,
    );
  }
  const validated: string[] = [];
  for (let i = 0; i < result.length; i++) {
    const value = result[i];
    if (typeof value !== 'string') {
      throw new Error(
        `translate item ${i} was not a string: ${preview(value)}`,
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

export type { MessageContext, TranslateRequest, Translator };
