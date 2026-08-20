import type { ContextLevel, Translator } from 'yapyak/translator';

import {
  TranslatorInvalidResponseError,
  TranslatorTruncatedError,
  createTranslator,
} from 'yapyak/translator';
import {
  buildSystem,
  causeToError,
  fetchWithRetry,
  parseResponseBody,
  parseTranslationsBatch,
  resolveMaxTokens,
  responseToError,
} from 'yapyak/translator/internal';

/** Options for {@link ollama}. */
export type OllamaOptions = {
  /**
   * The maximum items per API call.
   *
   * @defaultValue `8`
   */
  batchSize?: number;
  /**
   * The maximum parallel API calls.
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
   * The API endpoint.
   *
   * @defaultValue `'http://localhost:11434/api/generate'`
   */
  endpoint?: string;
  /**
   * The maximum style-reference examples per request.
   *
   * @defaultValue `5`, or `0` when `context` is `'none'`
   */
  examples?: number;
  /** The translation glossary. */
  glossary?: Record<string, Record<string, string>>;
  /** The extra request headers. */
  headers?: Record<string, string>;
  /**
   * The maximum retry attempts.
   *
   * @defaultValue `1`
   */
  maxRetries?: number;
  /** The output-token cap. */
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
  /** The voice and tone guidance. */
  voice?: string;
};

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_BATCH_SIZE = 8;
const MAX_TOKENS_CAP = 4000;
const MAX_TOKENS_FLOOR = 1024;
const MAX_TOKENS_PER_ITEM = 96;

/**
 * Creates an Ollama translator.
 *
 * @param options - The options.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { ollama } from '@yapyak/ollama';
 *
 * export default defineConfig({
 *   translator: ollama({ model: 'llama3.1' })
 * });
 * ```
 */
export function ollama(options: OllamaOptions = {}): Translator {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    concurrency,
    context,
    endpoint = DEFAULT_ENDPOINT,
    examples,
    glossary,
    headers: customHeaders,
    maxRetries = DEFAULT_MAX_RETRIES,
    maxTokens,
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
    voice,
  } = options;

  return createTranslator({
    batchSize,
    concurrency,
    context,
    examples,
    id: 'ollama',
    translate: async (request) => {
      const { items, signal, sourceLocale, targetLocales } = request;
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
          system: buildSystem(sourceLocale, targetLocales, {
            glossary,
            voice,
          }),
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
      let response: Response;
      try {
        response = await fetchWithRetry(endpoint, init, fetchOptions);
      } catch (cause) {
        throw causeToError(cause, 'ollama');
      }
      if (!response.ok) {
        throw await responseToError(response, 'ollama');
      }
      const responseBody = await parseResponseBody<OllamaResponseBody>(
        response,
        'ollama',
        signal,
      );
      validateResponse(responseBody);
      const text = responseBody.response;
      if (typeof text !== 'string') {
        throw new TranslatorInvalidResponseError(
          'yapyak ollama: response did not contain a response field.',
          {
            vendor: 'ollama',
          },
        );
      }
      return parseTranslationsBatch(text, 'ollama');
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
    throw new TranslatorTruncatedError(
      "yapyak ollama: response truncated by token limit (done_reason='length'). Lower batchSize or raise `maxTokens` in the translator options.",
      {
        vendor: 'ollama',
      },
    );
  }
}
