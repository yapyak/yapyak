import { type ContextLevel, createTranslator } from './create.js';
import { fetchWithRetry } from './http.js';
import type { Translator } from './types.js';

export interface OpenAIOptions {
  apiKey: string;
  batchSize?: number;
  context?: ContextLevel;
  endpoint?: string;
  glossary?: Record<string, Record<string, string>>;
  headers?: Record<string, string>;
  maxRetries?: number;
  model?: string;
  organization?: string;
  seed?: number;
  temperature?: number;
  timeout?: number;
  user?: string;
  voice?: string;
}

const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

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
    async translate({ items, signal, sourceLocale, targetLocale }) {
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
        throw new Error(
          `yapyak/translators/openai: ${response.status} ${text}`,
        );
      }
      const responseBody = (await response.json()) as OpenAIChatResponse;
      const text = responseBody.choices?.[0]?.message?.content;
      if (typeof text !== 'string') {
        throw new Error(
          'yapyak/translators/openai: response did not contain a text block',
        );
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
  options: OpenAIOptions,
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
  glossary: OpenAIOptions['glossary'],
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
