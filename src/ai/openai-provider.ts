import { buildPrompt, SYSTEM_PROMPT } from './system-prompt.js';
import type { OpenAiModel, TranslateFunction } from './types.js';
import { OPENAI_DEFAULT_MODEL } from './types.js';

export interface OpenAiProviderOptions {
  apiKey: string;
  model?: OpenAiModel | undefined;
}

interface OpenAiResponse {
  choices: Array<{ message: { content: string } }>;
}

export function openaiProvider(
  options: OpenAiProviderOptions,
): TranslateFunction {
  const { apiKey, model = OPENAI_DEFAULT_MODEL } = options;

  return async function translate(input): Promise<string> {
    const prompt = buildPrompt({
      glossary: input.glossary,
      source: input.source,
      targetLocale: input.targetLocale,
      voice: input.voice,
    });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const json = (await response.json()) as OpenAiResponse;
    const content = json.choices[0]?.message.content ?? '';
    return content.trim();
  };
}
