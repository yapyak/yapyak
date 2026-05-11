import type { MessageContext, TranslateRequest, Translator } from './types.js';

export type ContextLevel = 'none' | 'minimal' | 'rich';

export interface TranslateItem {
  component?: string;
  element?: string;
  snippet?: string;
  source: string;
}

export interface TranslateParams {
  items: TranslateItem[];
  signal?: AbortSignal;
  sourceLocale: string;
  targetLocale: string;
}

export interface CreateTranslatorOptions {
  batchSize?: number | undefined;
  context?: ContextLevel | undefined;
  translate: (params: TranslateParams) => string[] | Promise<string[]>;
}

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_CONTEXT: ContextLevel = 'minimal';

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
