/**
 * OpenAI translator for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/openai
 * # or
 * pnpm add @yapyak/openai
 * ```
 *
 * @packageDocumentation
 */

import type { ContextLevel, Translator } from '@yapyak/translator';

import { createTranslator } from '@yapyak/translator';
import {
  buildSystem,
  fetchWithRetry,
  stripCodeFence,
} from '@yapyak/translator/internal';

/** Options for {@link openai}. */
export interface OpenAIOptions {
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
   * The API endpoint.
   *
   * @defaultValue `'https://api.openai.com/v1/chat/completions'`
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
   * @defaultValue `'gpt-5-mini'`
   */
  model?: string;
  /** The OpenAI organization ID. */
  organization?: string;
  /** The deterministic seed for reproducible output. */
  seed?: number;
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
  /** The stable end-user identifier forwarded to OpenAI. */
  user?: string;
  /** The voice and tone guidance passed to the model. */
  voice?: string;
}

const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Creates an OpenAI translator.
 *
 * @param options - The translator options.
 *
 * @example Configure as the translator
 * ```ts
 * import { openai } from '@yapyak/openai';
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
    id: 'openai',
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
