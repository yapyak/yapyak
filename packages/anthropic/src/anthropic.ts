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

/** Options for {@link anthropic}. */
export type AnthropicOptions = {
  /** The API key. */
  apiKey: string;
  /**
   * The maximum items per API call.
   *
   * @defaultValue `25`
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
   * @defaultValue `'https://api.anthropic.com/v1/messages'`
   */
  endpoint?: string;
  /** The translation glossary. */
  glossary?: Record<string, Record<string, string>>;
  /** The extra request headers. */
  headers?: Record<string, string>;
  /**
   * The maximum retry attempts.
   *
   * @defaultValue `2`
   */
  maxRetries?: number;
  /** The output-token cap. */
  maxTokens?: number;
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
  /** The voice and tone guidance. */
  voice?: string;
};

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_TOKENS_CAP = 32_000;
const MAX_TOKENS_FLOOR = 1024;
const MAX_TOKENS_PER_ITEM = 96;

/**
 * Creates an Anthropic translator.
 *
 * @param options - The options.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { anthropic } from '@yapyak/anthropic';
 *
 * export default defineConfig({
 *   translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
 * });
 * ```
 *
 * @throws {Error} When `apiKey` is missing or empty.
 */
export function anthropic(options: AnthropicOptions): Translator {
  if (!options.apiKey) {
    const received =
      options.apiKey === undefined ? 'undefined' : 'empty string';
    throw new Error(
      `@yapyak/anthropic: apiKey is required, received ${received}.`,
    );
  }
  const {
    apiKey,
    batchSize,
    concurrency,
    context,
    endpoint = DEFAULT_ENDPOINT,
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
    id: 'anthropic',
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
          max_tokens: resolvedMaxTokens,
          messages: [
            {
              content: JSON.stringify(items),
              role: 'user',
            },
          ],
          model,
          system: buildSystem(sourceLocale, targetLocales, {
            glossary,
            voice,
          }),
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
        throw causeToError(cause, 'anthropic');
      }
      if (!response.ok) {
        throw await responseToError(response, 'anthropic');
      }
      const responseBody = await parseResponseBody<AnthropicResponseBody>(
        response,
        'anthropic',
        signal,
      );
      validateResponse(responseBody);
      const text = responseBody.content?.find(
        (block) => block.type === 'text',
      )?.text;
      if (typeof text !== 'string') {
        throw new TranslatorInvalidResponseError(
          'yapyak anthropic: response did not contain a text block.',
          {
            vendor: 'anthropic',
          },
        );
      }
      return parseTranslationsBatch(text, 'anthropic');
    },
  });
}

type AnthropicResponseBody = {
  content?: {
    text?: string;
    type: string;
  }[];
  // biome-ignore lint/style/useNamingConvention: yap yap yap
  stop_reason?:
    | 'end_turn'
    | 'max_tokens'
    | 'refusal'
    | 'stop_sequence'
    | 'tool_use';
};

function validateResponse(body: AnthropicResponseBody): void {
  if (body.stop_reason === 'max_tokens') {
    throw new TranslatorTruncatedError(
      "yapyak anthropic: response truncated by token limit (stop_reason='max_tokens'). Lower batchSize or raise `maxTokens` in the translator options.",
      {
        vendor: 'anthropic',
      },
    );
  }
  if (body.stop_reason === 'refusal') {
    throw new TranslatorSafetyError(
      "yapyak anthropic: response blocked by Anthropic content policy (stop_reason='refusal'). Adjust voice or glossary, or split the batch to isolate the offending message.",
      {
        vendor: 'anthropic',
      },
    );
  }
}
