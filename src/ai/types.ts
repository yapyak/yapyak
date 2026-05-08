export interface TranslateInput {
  defaultLocale: string;
  fileId: string;
  glossary: Record<string, Record<string, string>>;
  source: string;
  targetLocale: string;
  voice: string;
}

export type TranslateFunction = (input: TranslateInput) => Promise<string>;

export type AnthropicModel =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5';

export type OpenAiModel = 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano' | 'gpt-4o';

export interface AiBaseOptions {
  autoTranslate?: boolean;
  glossary?: Record<string, Record<string, string>>;
  voice?: string;
}

export type AiOptions = AiBaseOptions &
  (
    | {
        apiKey: string;
        model?: AnthropicModel;
        provider: 'anthropic';
      }
    | {
        apiKey: string;
        model?: OpenAiModel;
        provider: 'openai';
      }
    | {
        provider: TranslateFunction;
      }
  );

export const ANTHROPIC_DEFAULT_MODEL: AnthropicModel = 'claude-sonnet-4-6';
export const OPENAI_DEFAULT_MODEL: OpenAiModel = 'gpt-5-mini';
