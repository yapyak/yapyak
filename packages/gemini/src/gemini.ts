import type { ContextLevel, Translator } from 'yapyak/translator';

import {
  TranslatorInvalidResponseError,
  TranslatorSafetyError,
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

/** Options for {@link gemini}. */
export type GeminiOptions = {
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
   * The API endpoint base URL.
   *
   * @defaultValue `'https://generativelanguage.googleapis.com/v1beta'`
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
   * The output-token cap sent as `generationConfig.maxOutputTokens` to the Gemini API.
   *
   * @remarks
   * When omitted, the translator scales the cap to `items × targetLocales × 96` with a floor of `1024` and a ceiling of `8000`. Set this to override the scaled default for batches that need more or less headroom.
   */
  maxTokens?: number;
  /**
   * The model name.
   *
   * @defaultValue `'gemini-2.5-flash'`
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
};

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BATCH_SIZE = 15;
const MAX_TOKENS_CAP = 8000;
const MAX_TOKENS_FLOOR = 1024;
const MAX_TOKENS_PER_ITEM = 96;

/**
 * Creates a Gemini translator.
 *
 * @param options - The translator options.
 *
 * @example Configure as the translator
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { gemini } from '@yapyak/gemini';
 *
 * export default defineConfig({
 *   translator: gemini({ apiKey: process.env.GEMINI_API_KEY! }),
 * });
 * ```
 *
 * @throws {Error} When `apiKey` is missing or empty.
 */
export function gemini(options: GeminiOptions): Translator {
  if (!options.apiKey) {
    const received =
      options.apiKey === undefined ? 'undefined' : 'empty string';
    throw new Error(
      `@yapyak/gemini: apiKey is required, received ${received}.`,
    );
  }
  const {
    apiKey,
    batchSize = DEFAULT_BATCH_SIZE,
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
    id: 'gemini',
    translate: async (params) => {
      const { items, signal, sourceLocale, targetLocales } = params;
      const url = `${endpoint}/models/${model}:generateContent`;
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
          contents: [
            {
              parts: [
                {
                  text: JSON.stringify(items),
                },
              ],
              role: 'user',
            },
          ],
          generationConfig: {
            maxOutputTokens: resolvedMaxTokens,
            responseMimeType: 'application/json',
            temperature,
          },
          systemInstruction: {
            parts: [
              {
                text: buildSystem(sourceLocale, targetLocales, options),
              },
            ],
          },
        }),
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
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
        response = await fetchWithRetry(url, init, fetchOptions);
      } catch (cause) {
        throw causeToError(cause, 'gemini');
      }
      if (!response.ok) {
        throw await responseToError(response, 'gemini');
      }
      const responseBody = await parseResponseBody<GeminiResponseBody>(
        response,
        'gemini',
      );
      validateResponse(responseBody);
      const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== 'string') {
        throw new TranslatorInvalidResponseError(
          'yapyak gemini: response did not contain a text part.',
          {
            vendor: 'gemini',
          },
        );
      }
      return parseTranslationsBatch(text, 'gemini');
    },
  });
}

type GeminiResponseBody = {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
    finishReason?:
      | 'STOP'
      | 'MAX_TOKENS'
      | 'SAFETY'
      | 'RECITATION'
      | 'LANGUAGE'
      | 'OTHER';
  }[];
};

function validateResponse(body: GeminiResponseBody): void {
  const reason = body.candidates?.[0]?.finishReason;
  if (reason === 'MAX_TOKENS') {
    throw new TranslatorTruncatedError(
      "yapyak gemini: response truncated by token limit (finishReason='MAX_TOKENS'). Lower batchSize or raise `maxTokens` in the translator options.",
      {
        vendor: 'gemini',
      },
    );
  }
  if (reason === 'SAFETY') {
    throw new TranslatorSafetyError(
      "yapyak gemini: response blocked by Gemini safety filter (finishReason='SAFETY'). Adjust voice or glossary, or split the batch to isolate the offending message.",
      {
        vendor: 'gemini',
      },
    );
  }
  if (reason === 'RECITATION') {
    throw new TranslatorSafetyError(
      "yapyak gemini: response blocked by Gemini recitation filter (finishReason='RECITATION'). The model refused to reproduce protected content.",
      {
        vendor: 'gemini',
      },
    );
  }
}
