import type { TranslateRequest, Translator } from './types.js';

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
const DEFAULT_BATCH_SIZE = 10;

export function openai(options: OpenAIOptions): Translator {
  const model = options.model ?? DEFAULT_MODEL;
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

  async function single(request: TranslateRequest): Promise<string> {
    const results = await batch([request]);
    return results[0] ?? '';
  }

  async function batch(requests: TranslateRequest[]): Promise<string[]> {
    if (requests.length === 0) {
      return [];
    }
    const reference = requests[0];
    if (reference === undefined) {
      return [];
    }
    const systemPrompt = buildSystemPrompt(options, reference, requests.length);
    const userPrompt = JSON.stringify(requests.map((r) => r.source));

    const response = await fetch(endpoint, {
      body: JSON.stringify({
        messages: [
          { content: systemPrompt, role: 'system' },
          { content: userPrompt, role: 'user' },
        ],
        model,
      }),
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    });
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
    return parseBatchResponse(text, requests.length);
  }

  const translator = single as Translator;
  translator.batch = async (requests) => {
    const size = options.batchSize ?? DEFAULT_BATCH_SIZE;
    const results: string[] = [];
    for (let i = 0; i < requests.length; i += size) {
      const chunk = requests.slice(i, i + size);
      const chunkResults = await batch(chunk);
      results.push(...chunkResults);
    }
    return results;
  };
  return translator;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string; role: string };
  }>;
}

function parseBatchResponse(text: string, expectedLength: number): string[] {
  const trimmed = text.trim();
  const cleaned = stripCodeFence(trimmed);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (cause) {
    throw new Error(
      `yapyak/translators/openai: failed to parse batch JSON response: ${(cause as Error).message}\n${cleaned.slice(0, 200)}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      'yapyak/translators/openai: batch response was not a JSON array',
    );
  }
  if (parsed.length !== expectedLength) {
    throw new Error(
      `yapyak/translators/openai: batch response had ${parsed.length} items, expected ${expectedLength}`,
    );
  }
  return parsed.map((value) => String(value).trim());
}

function stripCodeFence(text: string): string {
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    const start = lines[0]?.startsWith('```') ? 1 : 0;
    const end = lines[lines.length - 1] === '```' ? lines.length - 1 : lines.length;
    return lines.slice(start, end).join('\n');
  }
  return text;
}

function buildSystemPrompt(
  options: OpenAIOptions,
  reference: TranslateRequest,
  count: number,
): string {
  const lines: string[] = [
    `You are a professional translator. Translate ${count > 1 ? 'each string' : 'the user\'s message'} from ${reference.sourceLocale} to ${reference.targetLocale}.`,
  ];
  if (count > 1) {
    lines.push(
      `Input is a JSON array of source strings. Return ONLY a valid JSON array of the same length containing the translated strings, in the same order. No commentary, no markdown, no labels.`,
    );
  } else {
    lines.push(
      'Return only the translated string. No commentary, no quotes, no labels.',
    );
  }
  lines.push(
    'Preserve all {placeholder} tokens and ICU patterns exactly as written.',
  );
  if (options.voice !== undefined && options.voice !== '') {
    lines.push(`Voice: ${options.voice}`);
  }
  const glossaryLines = collectGlossary(options.glossary, reference.targetLocale);
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
