import { parseBatchResponse } from './parse-batch-response.js';
import {
  BATCH_SYSTEM_PROMPT,
  buildBatchPrompt,
  buildPrompt,
  SYSTEM_PROMPT,
} from './system-prompt.js';
import type { AnthropicModel, Provider } from './types.js';
import { ANTHROPIC_DEFAULT_MODEL } from './types.js';

export interface AnthropicProviderOptions {
  apiKey: string;
  model?: AnthropicModel | undefined;
}

interface AnthropicResponse {
  content: Array<{ text?: string; type: string }>;
}

export function anthropicProvider(options: AnthropicProviderOptions): Provider {
  const { apiKey, model = ANTHROPIC_DEFAULT_MODEL } = options;

  async function callAnthropic(
    system: string,
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${text}`);
    }

    const json = (await response.json()) as AnthropicResponse;
    return (
      json.content.find((part) => part.type === 'text')?.text ?? ''
    ).trim();
  }

  return {
    async translate(input): Promise<string> {
      const prompt = buildPrompt({
        context: input.context,
        glossary: input.glossary,
        source: input.source,
        targetLocale: input.targetLocale,
        voice: input.voice,
      });
      return callAnthropic(SYSTEM_PROMPT, prompt, 1024);
    },

    async translateBatch(input): Promise<string[]> {
      const prompt = buildBatchPrompt({
        contexts: input.contexts,
        glossary: input.glossary,
        sources: input.sources,
        targetLocale: input.targetLocale,
        voice: input.voice,
      });
      const maxTokens = Math.min(8192, 256 + input.sources.length * 200);
      const text = await callAnthropic(BATCH_SYSTEM_PROMPT, prompt, maxTokens);
      return parseBatchResponse(text, input.sources.length);
    },
  };
}
