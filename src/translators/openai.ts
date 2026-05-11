import { createTranslator } from './create.js';
import type { Translator } from './types.js';

export interface OpenAIOptions {
  apiKey: string;
  batchSize?: number;
  endpoint?: string;
  glossary?: Record<string, Record<string, string>>;
  model?: string;
  voice?: string;
}

const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export function openai(options: OpenAIOptions): Translator {
  const model = options.model ?? DEFAULT_MODEL;
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

  return createTranslator({
    batchSize: options.batchSize,
    async translate({ items, signal, sourceLocale, targetLocale }) {
      const init: RequestInit = {
        body: JSON.stringify({
          messages: [
            {
              content: buildSystem(options, sourceLocale, targetLocale),
              role: 'system',
            },
            { content: JSON.stringify(items), role: 'user' },
          ],
          model,
        }),
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          'content-type': 'application/json',
        },
        method: 'POST',
      };
      if (signal !== undefined) {
        init.signal = signal;
      }
      const response = await fetch(endpoint, init);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `yapyak/translators/openai: ${response.status} ${text}`,
        );
      }
      const body = (await response.json()) as OpenAIChatResponse;
      const text = body.choices?.[0]?.message?.content;
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
    'Input is a JSON array. Each item has a `source` string to translate and optional `component` and `element` fields giving usage context (use them to inform tone — a `button` element wants concise imperatives, a `h1` wants strong nouns, a `label` wants direct nouns).',
    'Output: a JSON array of plain strings — same length, same order. Each output element MUST be a string, not an object. Do not echo the input shape. Do not include `source`, `component`, or `element` keys in the output. No commentary, no markdown, no code fences, no labels. Just the JSON array of translated strings.',
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
