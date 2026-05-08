import { anthropicProvider } from './anthropic-provider.js';
import { openaiProvider } from './openai-provider.js';
import type { AiOptions, Provider } from './types.js';

export function resolveProvider(options: AiOptions): Provider {
  if (typeof options.provider === 'function') {
    return { translate: options.provider };
  }
  if (typeof options.provider === 'object' && options.provider !== null) {
    return options.provider;
  }
  if (options.provider === 'anthropic') {
    return anthropicProvider({ apiKey: options.apiKey, model: options.model });
  }
  if (options.provider === 'openai') {
    return openaiProvider({ apiKey: options.apiKey, model: options.model });
  }
  throw new Error(
    `Unknown provider: ${String((options as AiOptions).provider)}`,
  );
}
