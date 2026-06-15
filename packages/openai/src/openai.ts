import type { ContextLevel, Translator } from 'yapyak/translator';

import { createTranslator } from 'yapyak/translator';
import {
  buildSystem,
  fetchWithRetry,
  parseResponseBody,
  parseTranslationsBatch,
  resolveMaxTokens,
  stripCodeFence,
} from 'yapyak/translator/internal';

/** Options for {@link openai}. */
export type OpenAIOptions = {
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
   * The output-token cap sent to the OpenAI API.
   *
   * @remarks
   * Sent as `max_completion_tokens` for reasoning models (`gpt-5*`, `o[1-9]*`) and as `max_tokens` for chat-completion models. When omitted, the model's own default applies.
   */
  maxTokens?: number;
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
};

const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_TOKENS_CAP = 16_000;
const MAX_TOKENS_FLOOR = 1024;
const MAX_TOKENS_PER_ITEM = 96;
const REASONING_MODEL_RX = /^(gpt-5|o[1-9])/;

/**
 * Creates an OpenAI translator.
 *
 * @param options - The translator options.
 *
 * @example Configure as the translator
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { openai } from '@yapyak/openai';
 *
 * export default defineConfig({
 *   translator: openai({ apiKey: process.env.OPENAI_API_KEY! }),
 * });
 * ```
 *
 * @throws {Error} When `apiKey` is missing or empty.
 */
export function openai(options: OpenAIOptions): Translator {
  if (!options.apiKey) {
    const received =
      options.apiKey === undefined ? 'undefined' : 'empty string';
    throw new Error(
      `@yapyak/openai: apiKey is required, received ${received}.`,
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
    maxTokens,
    model = DEFAULT_MODEL,
    organization,
    seed,
    temperature = DEFAULT_TEMPERATURE,
    timeout = DEFAULT_TIMEOUT,
    user,
  } = options;

  return createTranslator({
    batchSize,
    concurrency,
    context,
    id: 'openai',
    translate: async (params) => {
      const { items, signal, sourceLocale, targetLocales } = params;
      const body: Record<string, unknown> = {
        messages: [
          {
            content: buildSystem(sourceLocale, targetLocales, options),
            role: 'system',
          },
          {
            content: JSON.stringify(items),
            role: 'user',
          },
        ],
        model,
      };
      const isReasoningModel = REASONING_MODEL_RX.test(model);
      if (!isReasoningModel) {
        body.temperature = temperature;
      }
      const resolvedMaxTokens = resolveMaxTokens({
        cap: MAX_TOKENS_CAP,
        floor: MAX_TOKENS_FLOOR,
        itemCount: items.length,
        localeCount: targetLocales.length,
        override: maxTokens,
        perItem: MAX_TOKENS_PER_ITEM,
      });
      if (isReasoningModel) {
        body.max_completion_tokens = resolvedMaxTokens;
      } else {
        body.max_tokens = resolvedMaxTokens;
      }
      if (seed !== undefined) {
        body.seed = seed;
      }
      if (user) {
        body.user = user;
      }
      const headers: Record<string, string> = {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        ...customHeaders,
      };
      if (organization) {
        headers['OpenAI-Organization'] = organization;
      }
      const init: RequestInit = {
        body: JSON.stringify(body),
        headers,
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
        throw new Error(`yapyak openai: ${response.status} ${text}`);
      }
      const responseBody = await parseResponseBody<OpenAIResponseBody>(
        response,
        'openai',
      );
      validateResponse(responseBody);
      const text = responseBody.choices?.[0]?.message?.content;
      if (typeof text !== 'string') {
        throw new Error('yapyak openai: response did not contain a text block');
      }
      return parseTranslationsBatch(stripCodeFence(text.trim()), 'openai');
    },
  });
}

type OpenAIResponseBody = {
  choices?: {
    // biome-ignore lint/style/useNamingConvention: yap yap yap
    finish_reason?:
      | 'stop'
      | 'length'
      | 'tool_calls'
      | 'content_filter'
      | 'function_call';
    message?: {
      content?: string;
      role: string;
    };
  }[];
};

function validateResponse(body: OpenAIResponseBody): void {
  const reason = body.choices?.[0]?.finish_reason;
  if (reason === 'length') {
    throw new Error(
      "yapyak openai: response truncated by token limit (finish_reason='length'). Lower batchSize or raise `maxTokens` in the translator options.",
    );
  }
  if (reason === 'content_filter') {
    throw new Error(
      "yapyak openai: response blocked by OpenAI content filter (finish_reason='content_filter'). Adjust voice or glossary, or split the batch to isolate the offending message.",
    );
  }
}
