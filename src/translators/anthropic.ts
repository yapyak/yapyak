import { type ContextLevel, createTranslator } from './create.js';
import { fetchWithRetry } from './fetch.js';
import { buildSystem, stripCodeFence } from './prompt.js';
import type { Translator } from './types.js';

/** Options for the Anthropic translator. */
export interface AnthropicOptions {
  /** Your Anthropic API key. */
  apiKey: string;
  /** Max items per API call. Defaults to 10. */
  batchSize?: number;
  /** How much call-site context to include. Defaults to `'minimal'`. */
  context?: ContextLevel;
  /** Override the API endpoint. */
  endpoint?: string;
  /** Glossary of fixed translations, keyed by source string then locale. */
  glossary?: Record<string, Record<string, string>>;
  /** Extra request headers. */
  headers?: Record<string, string>;
  /** Max retry attempts on transient failures. Defaults to 2. */
  maxRetries?: number;
  /** Model name. Defaults to `'claude-sonnet-4-6'`. */
  model?: string;
  /** Sampling temperature. Defaults to 0.2. */
  temperature?: number;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
  /** Voice/tone guidance passed to the model. */
  voice?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Translator backed by the Anthropic Messages API.
 *
 * @param options - The translator options.
 * @returns A translator usable in the Vite plugin config.
 *
 * @example
 * ```ts
 * import { anthropic } from 'yapyak/translators/anthropic';
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
    async translate(params) {
      const { items, signal, sourceLocale, targetLocale } = params;
      const init: RequestInit = {
        body: JSON.stringify({
          max_tokens: Math.max(1024, items.length * 256),
          messages: [
            { content: JSON.stringify(items), role: 'user' },
          ],
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
        throw new Error(
          `yapyak/translators/anthropic: ${response.status} ${text}`,
        );
      }
      const body = (await response.json()) as AnthropicMessageResponse;
      const text = body.content?.[0]?.text;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak/translators/anthropic: response did not contain a text block',
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
