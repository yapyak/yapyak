import { parseBatchResponse } from './parse-batch-response.js';
import {
  BATCH_SYSTEM_PROMPT,
  buildBatchPrompt,
  buildPrompt,
  SYSTEM_PROMPT,
} from './system-prompt.js';
import type { OpenAiModel, Provider } from './types.js';
import { OPENAI_DEFAULT_MODEL } from './types.js';

export interface OpenAiProviderOptions {
  apiKey: string;
  model?: OpenAiModel | undefined;
}

interface OpenAiResponse {
  choices: Array<{ message: { content: string } }>;
}

export function openaiProvider(options: OpenAiProviderOptions): Provider {
  const { apiKey, model = OPENAI_DEFAULT_MODEL } = options;

  async function callOpenAi(system: string, prompt: string): Promise<string> {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const json = (await response.json()) as OpenAiResponse;
    return (json.choices[0]?.message.content ?? '').trim();
  }

  return {
    async translate(input): Promise<string> {
      const prompt = buildPrompt({
        glossary: input.glossary,
        source: input.source,
        targetLocale: input.targetLocale,
        voice: input.voice,
      });
      return callOpenAi(SYSTEM_PROMPT, prompt);
    },

    async translateBatch(input): Promise<string[]> {
      const prompt = buildBatchPrompt({
        glossary: input.glossary,
        sources: input.sources,
        targetLocale: input.targetLocale,
        voice: input.voice,
      });
      const text = await callOpenAi(BATCH_SYSTEM_PROMPT, prompt);
      return parseBatchResponse(text, input.sources.length);
    },
  };
}
