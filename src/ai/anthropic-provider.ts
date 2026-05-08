import { buildPrompt, SYSTEM_PROMPT } from './system-prompt.js';
import type { AnthropicModel, TranslateFunction } from './types.js';
import { ANTHROPIC_DEFAULT_MODEL } from './types.js';

export interface AnthropicProviderOptions {
  apiKey: string;
  model?: AnthropicModel | undefined;
}

interface AnthropicResponse {
  content: Array<{ text?: string; type: string }>;
}

export function anthropicProvider(
  options: AnthropicProviderOptions,
): TranslateFunction {
  const { apiKey, model = ANTHROPIC_DEFAULT_MODEL } = options;

  return async function translate(input): Promise<string> {
    const prompt = buildPrompt({
      glossary: input.glossary,
      source: input.source,
      targetLocale: input.targetLocale,
      voice: input.voice,
    });
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${text}`);
    }

    const json = (await response.json()) as AnthropicResponse;
    const text = json.content.find((part) => part.type === 'text')?.text ?? '';
    return text.trim();
  };
}
