import type {
  ContextLevel,
  CreateTranslatorOptions,
  LocaleTranslations,
  TranslateBatchOptions,
  TranslateBatchRequest,
  TranslateFn,
  TranslateItem,
  TranslateRequest,
  Translator,
} from './type';

import { warn } from '../warn';

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_CONTEXT: ContextLevel = 'minimal';
const DEFAULT_ID = 'custom';

/**
 * Builds a translator from a `translate` function.
 *
 * @remarks
 * Handles batching, context shaping, deduplication across target locales, and result validation. The provided function talks to the AI and receives every target locale in one call so terminology stays consistent and round-trips stay minimal.
 *
 * @param translate - Translates a batch of items into every target locale.
 * @param options - Tuning knobs. See {@link CreateTranslatorOptions}.
 *
 * @example
 * ```ts
 * const myTranslator = createTranslator(
 *   async ({ items, sourceLocale, targetLocales }) => {
 *     const response = await fetch('https://my-api.example/translate', {
 *       method: 'POST',
 *       body: JSON.stringify({ items, sourceLocale, targetLocales }),
 *     });
 *     const { translations } = await response.json();
 *     return translations;
 *   },
 * );
 * ```
 */
export function createTranslator(
  translate: TranslateFn,
  options?: CreateTranslatorOptions,
): Translator {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error(
      `createTranslator: batchSize must be a positive integer, got ${String(batchSize)}.`,
    );
  }
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error(
      `createTranslator: concurrency must be a positive integer, got ${String(concurrency)}.`,
    );
  }
  const contextLevel = options?.context ?? DEFAULT_CONTEXT;

  async function batch(
    requests: TranslateRequest[],
    batchOptions?: TranslateBatchOptions,
  ): Promise<string[]> {
    if (requests.length === 0) {
      return [];
    }

    const uniqueRequests: TranslateRequest[] = [];
    const indexOfUnique = new Map<string, number>();
    const requestToUnique = new Array<number>(requests.length);
    const uniqueTargetLocales = new Set<string>();
    for (let requestIndex = 0; requestIndex < requests.length; requestIndex++) {
      const request = requests[requestIndex];
      if (!request) {
        continue;
      }
      const key = toUniqueKey(request);
      let uniqueIndex = indexOfUnique.get(key);
      if (uniqueIndex === undefined) {
        uniqueIndex = uniqueRequests.length;
        indexOfUnique.set(key, uniqueIndex);
        uniqueRequests.push(request);
      }
      requestToUnique[requestIndex] = uniqueIndex;
      uniqueTargetLocales.add(request.targetLocale);
    }
    const targetLocales = [
      ...uniqueTargetLocales,
    ].sort();

    const chunks: TranslateRequest[][] = [];
    for (
      let chunkStart = 0;
      chunkStart < uniqueRequests.length;
      chunkStart += batchSize
    ) {
      chunks.push(uniqueRequests.slice(chunkStart, chunkStart + batchSize));
    }
    if (chunks.length === 0) {
      return [];
    }

    const chunkResults: LocaleTranslations[][] = new Array(chunks.length);
    let cursor = 0;
    async function worker(): Promise<void> {
      while (cursor < chunks.length) {
        const myIndex = cursor;
        cursor += 1;
        const chunk = chunks[myIndex];
        if (!chunk) {
          continue;
        }
        if (batchOptions?.signal?.aborted) {
          throw toAbortError(batchOptions.signal);
        }
        try {
          const result = await runChunk(
            chunk,
            targetLocales,
            batchOptions?.signal,
          );
          chunkResults[myIndex] = result;
          batchOptions?.onChunkComplete?.(chunk, result);
          batchOptions?.onChunk?.(result.length * targetLocales.length);
        } catch (error) {
          if (batchOptions?.signal?.aborted) {
            throw error;
          }
          if (batchOptions?.onChunkError) {
            batchOptions.onChunkError(error, chunk);
          } else {
            warn('Translate batch chunk failed — keeping other chunks.', {
              cause: error,
              code: 'YPK_TRANSLATE_CHUNK_FAILED',
            });
          }
        }
      }
    }
    const workerCount = Math.min(concurrency, chunks.length);
    await Promise.all(
      Array.from(
        {
          length: workerCount,
        },
        () => worker(),
      ),
    );

    const uniqueTranslations: (LocaleTranslations | undefined)[] = new Array(
      uniqueRequests.length,
    );
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkOffset = chunkIndex * batchSize;
      const result = chunkResults[chunkIndex];
      if (!result) {
        continue;
      }
      for (let resultIndex = 0; resultIndex < result.length; resultIndex++) {
        uniqueTranslations[chunkOffset + resultIndex] = result[resultIndex];
      }
    }
    return requests.map((request, index) => {
      const uniqueIndex = requestToUnique[index] ?? -1;
      const translations = uniqueTranslations[uniqueIndex];
      if (!translations) {
        return '';
      }
      return translations[request.targetLocale] ?? '';
    });
  }

  async function runChunk(
    uniqueRequests: TranslateRequest[],
    targetLocales: string[],
    signal: AbortSignal | undefined,
  ): Promise<LocaleTranslations[]> {
    const reference = uniqueRequests[0];
    if (!reference) {
      return [];
    }
    const items = uniqueRequests.map((request) =>
      toItem(request, contextLevel),
    );
    const request: TranslateBatchRequest = {
      items,
      sourceLocale: reference.sourceLocale,
      targetLocales,
    };
    if (signal !== undefined) {
      request.signal = signal;
    }
    const result = await translate(request);
    return validateBatch(result, {
      items,
      sourceLocale: reference.sourceLocale,
      targetLocales,
    });
  }

  async function single(request: TranslateRequest): Promise<string> {
    const result = await runChunk(
      [
        request,
      ],
      [
        request.targetLocale,
      ],
      undefined,
    );
    return result[0]?.[request.targetLocale] ?? '';
  }

  return Object.assign(single, {
    batch,
    context: contextLevel,
    id: options?.id ?? DEFAULT_ID,
  });
}

function toUniqueKey(request: TranslateRequest): string {
  return `${request.fileId}\x00${request.source}\x00${request.disambiguation ?? ''}`;
}

function toItem(request: TranslateRequest, level: ContextLevel): TranslateItem {
  const item: TranslateItem = {
    source: request.source,
  };
  if (request.disambiguation !== undefined) {
    item.disambiguation = request.disambiguation;
  }
  if (request.examples && request.examples.length > 0) {
    item.examples = request.examples;
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

type BatchContext = {
  items: TranslateItem[];
  sourceLocale: string;
  targetLocales: string[];
};

function validateBatch(
  result: unknown,
  context: BatchContext,
): LocaleTranslations[] {
  const expectedLength = context.items.length;
  const localeSummary = `${context.sourceLocale} → ${context.targetLocales.join(', ')}`;
  const sources = context.items
    .map((item) => JSON.stringify(item.source))
    .join(', ');

  if (!Array.isArray(result)) {
    throw new Error(
      `translate (${localeSummary}) must return an array of ${expectedLength} object${expectedLength === 1 ? '' : 's'}, got ${typeof result}.\n` +
        `Sources: ${sources}`,
    );
  }
  if (result.length !== expectedLength) {
    throw new Error(
      `translate (${localeSummary}) returned ${result.length} item${result.length === 1 ? '' : 's'}, expected ${expectedLength}.\n` +
        `Sources: ${sources}`,
    );
  }
  return result.map((entry) => normalizeEntry(entry, context.targetLocales));
}

function toAbortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }
  return new Error('Translate batch aborted.');
}

function normalizeEntry(
  entry: unknown,
  targetLocales: string[],
): LocaleTranslations {
  if (typeof entry !== 'object' || entry === null) {
    return {};
  }
  const record = entry as Record<string, unknown>;
  const translations: LocaleTranslations = {};
  for (const locale of targetLocales) {
    const value = record[locale];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        translations[locale] = trimmed;
      }
    }
  }
  return translations;
}
