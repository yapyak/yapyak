import type { ContextLevel, Translator } from '.';

import { fetchWithRetry } from './fetch';
import { createTranslator } from '.';
import { buildSystem, stripCodeFence } from './prompt';

/** Options for the OpenAI translator. */
export interface OpenAIOptions {
  /** Your OpenAI API key. */
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
  /** Model name. Defaults to `'gpt-5-mini'`. */
  model?: string;
  /** OpenAI organization ID. */
  organization?: string;
  /** Deterministic seed for reproducible output. */
  seed?: number;
  /** Sampling temperature. Defaults to 0.2. */
  temperature?: number;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
  /** Stable end-user identifier forwarded to OpenAI. */
  user?: string;
  /** Voice/tone guidance passed to the model. */
  voice?: string;
}

const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Translator backed by the OpenAI Chat Completions API.
 *
 * @param options - The translator options.
 * @returns A translator usable in the Vite plugin config.
 *
 * @example
 * ```ts
 * import { openai } from 'yapyak/translator';
 *
 * yapyak({
 *   translator: openai({ apiKey: process.env.OPENAI_API_KEY! }),
 * });
 * ```
 */
export function openai(options: OpenAIOptions): Translator {
  const {
    apiKey,
    batchSize,
    context,
    endpoint = DEFAULT_ENDPOINT,
    headers: customHeaders,
    maxRetries = DEFAULT_MAX_RETRIES,
    model = DEFAULT_MODEL,
    organization,
    seed,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
    user,
  } = options;

  return createTranslator({
    batchSize,
    context,
    async translate(params) {
      const { items, signal, sourceLocale, targetLocale } = params;
      const body: Record<string, unknown> = {
        messages: [
          {
            content: buildSystem(options, sourceLocale, targetLocale),
            role: 'system',
          },
          { content: JSON.stringify(items), role: 'user' },
        ],
        model,
        temperature,
      };
      if (seed !== undefined) {
        body.seed = seed;
      }
      if (user !== undefined) {
        body.user = user;
      }
      const headers: Record<string, string> = {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        ...customHeaders,
      };
      if (organization !== undefined) {
        headers['OpenAI-Organization'] = organization;
      }
      const init: RequestInit = {
        body: JSON.stringify(body),
        headers,
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
        throw new Error(`yapyak openai: ${response.status} ${text}`);
      }
      const responseBody = (await response.json()) as OpenAIChatResponse;
      const text = responseBody.choices?.[0]?.message?.content;
      if (typeof text !== 'string') {
        throw new Error('yapyak openai: response did not contain a text block');
      }
      const cleaned = stripCodeFence(text.trim());
      return JSON.parse(cleaned) as string[];
    },
  });
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string; role: string };
  }>;
}
