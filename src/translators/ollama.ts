import { type ContextLevel, createTranslator } from './create.js';
import { fetchWithRetry } from './fetch.js';
import { buildSystem } from './prompt.js';
import type { Translator } from './types.js';

export interface OllamaOptions {
  batchSize?: number;
  context?: ContextLevel;
  endpoint?: string;
  glossary?: Record<string, Record<string, string>>;
  headers?: Record<string, string>;
  maxRetries?: number;
  model?: string;
  temperature?: number;
  timeout?: number;
  voice?: string;
}

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 1;

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
        throw new Error(
          `yapyak/translators/ollama: ${response.status} ${text}`,
        );
      }
      const responseBody = (await response.json()) as OllamaResponse;
      const text = responseBody.response;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak/translators/ollama: response did not contain a response field',
        );
      }
      return JSON.parse(text.trim()) as string[];
    },
  });
}

interface OllamaResponse {
  response?: string;
}
