import type { ContextLevel, Translator } from 'yapyak/translator';

import { createTranslator } from 'yapyak/translator';
import {
  buildSystem,
  fetchWithRetry,
  parseResponseBody,
  parseTranslationsBatch,
  resolveMaxTokens,
} from 'yapyak/translator/internal';

/** Options for {@link ollama}. */
export type OllamaOptions = {
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
   * @defaultValue `'http://localhost:11434/api/generate'`
   */
  endpoint?: string;
  /** The glossary of fixed translations, keyed by source string then locale. */
  glossary?: Record<string, Record<string, string>>;
  /** The extra request headers. */
  headers?: Record<string, string>;
  /**
   * The maximum retry attempts on transient failures.
   *
   * @defaultValue `1`
   */
  maxRetries?: number;
  /**
   * The output-token cap sent as `options.num_predict` to the Ollama API.
   *
   * @remarks
   * When omitted, the model's own default applies.
   */
  maxTokens?: number;
  /**
   * The model name.
   *
   * @defaultValue `'llama3.1'`
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
   * @defaultValue `120_000`
   */
  timeout?: number;
  /** The voice and tone guidance passed to the model. */
  voice?: string;
};

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 1;
const MAX_TOKENS_CAP = 4000;
const MAX_TOKENS_FLOOR = 1024;
const MAX_TOKENS_PER_ITEM = 96;

/**
 * Creates an Ollama translator.
 *
 * @param options - The translator options.
 *
 * @example Configure as the translator
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { ollama } from '@yapyak/ollama';
 *
 * export default defineConfig({
 *   translator: ollama({ model: 'llama3.1' }),
 * });
 * ```
 */
export function ollama(options: OllamaOptions = {}): Translator {
  const {
    batchSize,
    concurrency,
    context,
    endpoint = DEFAULT_ENDPOINT,
    headers: customHeaders,
    maxRetries = DEFAULT_MAX_RETRIES,
    maxTokens,
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  return createTranslator({
    batchSize,
    concurrency,
    context,
    id: 'ollama',
    translate: async (params) => {
      const { items, signal, sourceLocale, targetLocales } = params;
      const resolvedMaxTokens = resolveMaxTokens({
        cap: MAX_TOKENS_CAP,
        floor: MAX_TOKENS_FLOOR,
        itemCount: items.length,
        localeCount: targetLocales.length,
        override: maxTokens,
        perItem: MAX_TOKENS_PER_ITEM,
      });
      const init: RequestInit = {
        body: JSON.stringify({
          format: 'json',
          model,
          options: {
            num_predict: resolvedMaxTokens,
            temperature,
          },
          prompt: JSON.stringify(items),
          stream: false,
          system: buildSystem(sourceLocale, targetLocales, options),
        }),
        headers: {
          'content-type': 'application/json',
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
        throw new Error(`yapyak ollama: ${response.status} ${text}`);
      }
      const responseBody = await parseResponseBody<OllamaResponseBody>(
        response,
        'ollama',
      );
      validateResponse(responseBody);
      const text = responseBody.response;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak ollama: response did not contain a response field',
        );
      }
      return parseTranslationsBatch(text.trim(), 'ollama');
    },
  });
}

type OllamaResponseBody = {
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  done_reason?: 'length' | 'stop' | (string & {});
  response?: string;
};

function validateResponse(body: OllamaResponseBody): void {
  if (body.done_reason === 'length') {
    throw new Error(
      "yapyak ollama: response truncated by token limit (done_reason='length'). Lower batchSize or raise `maxTokens` in the translator options.",
    );
  }
}
