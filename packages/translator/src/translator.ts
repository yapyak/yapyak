import type {
  ContextLevel,
  CreateTranslatorOptions,
  TranslateBatchOptions,
  TranslateItem,
  TranslateRequest,
  Translator,
} from './type';

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
  if (request.hint !== undefined) {
    item.hint = request.hint;
  }
  if (request.maxLength !== undefined) {
    item.maxLength = request.maxLength;
  }
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
