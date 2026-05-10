import type { TranslateRequest, Translator } from './types.js';

export interface AnthropicOptions {
  apiKey: string;
  endpoint?: string;
  glossary?: Record<string, Record<string, string>>;
  model?: string;
  voice?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-7';
const DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export function anthropic(options: AnthropicOptions): Translator {
  const model = options.model ?? DEFAULT_MODEL;
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  return async (request) => {
    const systemPrompt = buildSystemPrompt(options, request);
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        max_tokens: 1024,
        messages: [{ content: request.source, role: 'user' }],
        model,
        system: systemPrompt,
      }),
      headers: {
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
        'x-api-key': options.apiKey,
      },
      method: 'POST',
    });
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
    return text.trim();
  };
}

interface AnthropicMessageResponse {
  content?: Array<{ text?: string; type: string }>;
}

function buildSystemPrompt(
  options: AnthropicOptions,
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
