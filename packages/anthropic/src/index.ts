import type { ContextLevel, Translator } from '@yapyak/translator';

import {
  buildSystem,
  createTranslator,
  fetchWithRetry,
  stripCodeFence,
} from '@yapyak/translator';

/** Options for the {@link anthropic} translator. */
export interface AnthropicOptions {
  /** The Anthropic API key. */
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

/**
 * Creates an Anthropic translator.
 *
 * @param options - The translator options.
 *
 * @example
 * ```ts
 * import { anthropic } from '@yapyak/anthropic';
 *
 * yapyak({
 *   translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
 * });
 * ```
 */
export function anthropic(options: AnthropicOptions): Translator {
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
    id: 'anthropic',
    async translate(params) {
      const { items, signal, sourceLocale, targetLocale } = params;
      const init: RequestInit = {
        body: JSON.stringify({
          max_tokens: Math.max(1024, items.length * 256),
          messages: [{ content: JSON.stringify(items), role: 'user' }],
          model,
          system: buildSystem(options, sourceLocale, targetLocale),
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
      const fetchInit: Parameters<typeof fetchWithRetry>[0] = {
        init,
        maxRetries,
        timeout,
        url: endpoint,
      };
      if (signal !== undefined) {
        fetchInit.signal = signal;
      }
      const response = await fetchWithRetry(fetchInit);
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
      return JSON.parse(cleaned) as string[];
    },
  });
}

interface AnthropicMessageResponse {
  content?: Array<{ text?: string; type: string }>;
}
