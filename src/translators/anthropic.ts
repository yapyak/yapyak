import { type ContextLevel, createTranslator } from './create.js';
import { fetchWithRetry } from './http.js';
import type { Translator } from './types.js';

export interface AnthropicOptions {
  apiKey: string;
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

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

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
    async translate({ items, signal, sourceLocale, targetLocale }) {
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

function stripCodeFence(text: string): string {
  if (!text.startsWith('```')) {
    return text;
  }
  const lines = text.split('\n');
  const start = lines[0]?.startsWith('```') ? 1 : 0;
  const end =
    lines[lines.length - 1] === '```' ? lines.length - 1 : lines.length;
  return lines.slice(start, end).join('\n');
}

function buildSystem(
  options: AnthropicOptions,
  sourceLocale: string,
  targetLocale: string,
): string {
  const lines: string[] = [
    `You are a professional translator. Translate the source string in each input from ${sourceLocale} to ${targetLocale}.`,
    'Input is a JSON array. Each item has a `source` string to translate and optional `component`, `element`, and `snippet` fields giving usage context (use them to inform tone — a `button` element wants concise imperatives, a `h1` wants strong nouns, a `label` wants direct nouns; the `snippet` shows surrounding source code when provided).',
    'Output: a JSON array of plain strings — same length, same order. Each output element MUST be a string, not an object. Do not echo the input shape. Do not include `source`, `component`, `element`, or `snippet` keys in the output. No commentary, no markdown, no code fences, no labels. Just the JSON array of translated strings.',
    'Preserve all {placeholder} tokens and ICU patterns exactly as written.',
  ];
  if (options.voice !== undefined && options.voice !== '') {
    lines.push(`Voice: ${options.voice}`);
  }
  const glossaryLines = collectGlossary(options.glossary, targetLocale);
  if (glossaryLines.length > 0) {
    lines.push(
      'Use these glossary terms strictly when they appear in the source:',
    );
    for (const line of glossaryLines) {
      lines.push(`  ${line}`);
    }
  }
  return lines.join('\n');
}

function collectGlossary(
  glossary: AnthropicOptions['glossary'],
  targetLocale: string,
): string[] {
  if (glossary === undefined) {
    return [];
  }
  const lines: string[] = [];
  for (const [source, perLocale] of Object.entries(glossary)) {
    const translation = perLocale[targetLocale];
    if (typeof translation === 'string' && translation !== '') {
      lines.push(`"${source}" → "${translation}"`);
    }
  }
  return lines;
}
