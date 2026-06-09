import type {
  ContextLevel,
  LocaleTranslations,
  Translator,
} from 'yapyak/translator';

import { createTranslator } from 'yapyak/translator';
import {
  buildSystem,
  fetchWithRetry,
  stripCodeFence,
} from 'yapyak/translator/internal';

/** Options for {@link anthropic}. */
export interface AnthropicOptions {
  /** The API key. */
  apiKey: string;
  /**
   * The maximum items per API call.
   *
   * @defaultValue `25`
   */
  batchSize?: number;
  /**
   * The maximum number of API calls running in parallel.
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
   * The API endpoint.
   *
   * @defaultValue `'https://api.anthropic.com/v1/messages'`
   */
  endpoint?: string;
  /** The glossary of fixed translations, keyed by source string then locale. */
  glossary?: Record<string, Record<string, string>>;
  /** The extra request headers. */
  headers?: Record<string, string>;
  /**
   * The maximum retry attempts on transient failures.
   *
   * @defaultValue `2`
   */
  maxRetries?: number;
  /**
   * The model name.
   *
   * @defaultValue `'claude-sonnet-4-6'`
   */
  model?: string;
  /**
   * The sampling temperature.
   *
   * @defaultValue `0.2`
   */
  temperature?: number;
  /**
   * The request timeout in milliseconds.
   *
   * @defaultValue `30_000`
   */
  timeout?: number;
  /** The voice and tone guidance passed to the model. */
  voice?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_TOKENS_CAP = 8_000;

/**
 * Creates an Anthropic translator.
 *
 * @param options - The translator options.
 *
 * @example Configure as the translator
 * ```ts
 * import { anthropic } from '@yapyak/anthropic';
 *
 * yapyak({
 *   translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
 * });
 * ```
 *
 * @throws {Error} When `apiKey` is empty.
 */
export function anthropic(options: AnthropicOptions): Translator {
  if (!options.apiKey) {
    const received =
      options.apiKey === undefined ? 'undefined' : 'empty string';
    throw new Error(
      `@yapyak/anthropic: apiKey is required, received ${received}.`,
    );
  }
  const {
    apiKey,
    batchSize,
    concurrency,
    context,
    endpoint = DEFAULT_ENDPOINT,
    headers: customHeaders,
    maxRetries = DEFAULT_MAX_RETRIES,
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  return createTranslator(
    async (params) => {
      const { items, signal, sourceLocale, targetLocales } = params;
      const init: RequestInit = {
        body: JSON.stringify({
          max_tokens: Math.min(
            MAX_TOKENS_CAP,
            Math.max(1024, items.length * targetLocales.length * 96),
          ),
          messages: [{ content: JSON.stringify(items), role: 'user' }],
          model,
          system: buildSystem(options, sourceLocale, targetLocales),
          temperature,
        }),
        headers: {
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
          'x-api-key': apiKey,
          ...customHeaders,
        },
        method: 'POST',
      };
      const fetchOptions: Parameters<typeof fetchWithRetry>[2] = {
        maxRetries,
        timeout,
      };
      if (signal) {
        fetchOptions.signal = signal;
      }
      const response = await fetchWithRetry(endpoint, init, fetchOptions);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`yapyak anthropic: ${response.status} ${text}`);
      }
      const body = (await response.json()) as AnthropicMessageResponse;
      const text = body.content?.[0]?.text;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak anthropic: response did not contain a text block',
        );
      }
      const cleaned = stripCodeFence(text.trim());
      return JSON.parse(cleaned) as LocaleTranslations[];
    },
    { batchSize, concurrency, context, id: 'anthropic' },
  );
}

interface AnthropicMessageResponse {
  content?: Array<{ text?: string; type: string }>;
}
