import type { TranslateRequest, Translator } from './types.js';

export interface OpenAIOptions {
  apiKey: string;
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
  return async (request) => {
    const systemPrompt = buildSystemPrompt(options, request);
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        messages: [
          { content: systemPrompt, role: 'system' },
          { content: request.source, role: 'user' },
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
    return text.trim();
  };
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string; role: string };
  }>;
}

function buildSystemPrompt(
  options: OpenAIOptions,
  request: TranslateRequest,
): string {
  const lines: string[] = [
    `You are a professional translator. Translate the user's message from ${request.sourceLocale} to ${request.targetLocale}.`,
    'Return only the translated string. No commentary, no quotes, no labels.',
    'Preserve all {placeholder} tokens and ICU patterns exactly as written.',
  ];
  if (options.voice !== undefined && options.voice !== '') {
    lines.push(`Voice: ${options.voice}`);
  }
  const glossaryLines = collectGlossary(options.glossary, request.targetLocale);
  if (glossaryLines.length > 0) {
    lines.push(
      'Use these glossary terms strictly when they appear in the source:',
    );
    for (const line of glossaryLines) {
      lines.push(`  ${line}`);
    }
  }
  lines.push(`Context: file ${request.fileId}, key ${request.key}.`);
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
