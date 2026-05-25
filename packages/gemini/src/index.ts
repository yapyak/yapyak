/**
 * Gemini translator for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/gemini
 * # or
 * pnpm add @yapyak/gemini
 * ```
 *
 * @packageDocumentation
 */

import type { ContextLevel, Translator } from '@yapyak/translator';

import {
  buildSystem,
  createTranslator,
  fetchWithRetry,
  stripCodeFence,
} from '@yapyak/translator';

/** Options for {@link gemini}. */
export interface GeminiOptions {
  /** The API key. */
  apiKey: string;
  /**
   * The maximum items per API call.
   *
   * @defaultValue `10`
   */
  batchSize?: number;
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
}

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Creates a Gemini translator.
 *
 * @param options - The translator options.
 *
 * @example Configure as the translator
 * ```ts
 * import { gemini } from '@yapyak/gemini';
 *
 * yapyak({
 *   translator: gemini({ apiKey: process.env.GOOGLE_API_KEY! }),
 * });
 * ```
 */
export function gemini(options: GeminiOptions): Translator {
  const {
    apiKey,
    batchSize,
    context,
    endpoint = DEFAULT_ENDPOINT,
    headers: customHeaders,
    maxRetries = DEFAULT_MAX_RETRIES,
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  return createTranslator({
    batchSize,
    context,
    id: 'gemini',
    async translate(params) {
      const { items, signal, sourceLocale, targetLocale } = params;
      const url = `${endpoint}/models/${model}:generateContent`;
      const init: RequestInit = {
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: JSON.stringify(items) }],
              role: 'user',
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature,
          },
          systemInstruction: {
            parts: [{ text: buildSystem(options, sourceLocale, targetLocale) }],
          },
        }),
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
          ...customHeaders,
        },
        method: 'POST',
      };
      const fetchInit: Parameters<typeof fetchWithRetry>[0] = {
        init,
        maxRetries,
        timeout,
        url,
      };
      if (signal !== undefined) {
        fetchInit.signal = signal;
      }
      const response = await fetchWithRetry(fetchInit);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`yapyak gemini: ${response.status} ${text}`);
      }
      const responseBody = (await response.json()) as GeminiResponse;
      const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== 'string') {
        throw new Error('yapyak gemini: response did not contain a text part');
      }
      const cleaned = stripCodeFence(text.trim());
      return JSON.parse(cleaned) as string[];
    },
  });
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}
