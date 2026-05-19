import type { ContextLevel, Translator } from './index.ts';

import { fetchWithRetry } from './fetch.ts';
import { createTranslator } from './index.ts';
import { buildSystem } from './prompt.ts';

/** Options for the Ollama translator. */
export interface OllamaOptions {
  /** Max items per API call. Defaults to 10. */
  batchSize?: number;
  /** How much call-site context to include. Defaults to `'minimal'`. */
  context?: ContextLevel;
  /** Override the API endpoint. Defaults to `http://localhost:11434/api/generate`. */
  endpoint?: string;
  /** Glossary of fixed translations, keyed by source string then locale. */
  glossary?: Record<string, Record<string, string>>;
  /** Extra request headers. */
  headers?: Record<string, string>;
  /** Max retry attempts on transient failures. Defaults to 1. */
  maxRetries?: number;
  /** Model name. Defaults to `'llama3.1'`. */
  model?: string;
  /** Sampling temperature. Defaults to 0.2. */
  temperature?: number;
  /** Request timeout in milliseconds. Defaults to 120000. */
  timeout?: number;
  /** Voice/tone guidance passed to the model. */
  voice?: string;
}

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 1;

/**
 * Translator backed by a local Ollama server.
 *
 * @param options - The translator options.
 * @returns A translator usable in the Vite plugin config.
 *
 * @example
 * ```ts
 * import { ollama } from 'yapyak/translator';
 *
 * yapyak({
 *   translator: ollama({ model: 'llama3.1' }),
 * });
 * ```
 */
export function ollama(options: OllamaOptions = {}): Translator {
  const {
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
          format: 'json',
          model,
          options: {
            temperature,
          },
          prompt: JSON.stringify(items),
          stream: false,
          system: buildSystem(options, sourceLocale, targetLocale),
        }),
        headers: {
          'content-type': 'application/json',
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
        throw new Error(`yapyak ollama: ${response.status} ${text}`);
      }
      const responseBody = (await response.json()) as OllamaResponse;
      const text = responseBody.response;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak ollama: response did not contain a response field',
        );
      }
      return JSON.parse(text.trim()) as string[];
    },
  });
}

interface OllamaResponse {
  response?: string;
}
