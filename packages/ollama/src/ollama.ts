import type {
  ContextLevel,
  LocaleTranslations,
  Translator,
} from 'yapyak/translator';

import { createTranslator } from 'yapyak/translator';
import { buildSystem, fetchWithRetry } from 'yapyak/translator/internal';

/** Options for {@link ollama}. */
export interface OllamaOptions {
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
}

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 1;

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
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  return createTranslator(
    async (params) => {
      const { items, signal, sourceLocale, targetLocales } = params;
      const init: RequestInit = {
        body: JSON.stringify({
          format: 'json',
          model,
          options: {
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
      const responseBody = (await response.json()) as OllamaResponse;
      const text = responseBody.response;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak ollama: response did not contain a response field',
        );
      }
      return JSON.parse(text.trim()) as LocaleTranslations[];
    },
    { batchSize, concurrency, context, id: 'ollama' },
  );
}

interface OllamaResponse {
  response?: string;
}
