import type {
  ContextMode,
  Provider,
  TranslationContext,
} from '../../ai/index.js';
import type { MessageEntry } from '../generate-messages-module.js';

export interface RegenerateOptions {
  contextMode: ContextMode;
  entry: MessageEntry;
  glossary: Record<string, Record<string, string>>;
  locale: string;
  provider: Provider;
  voice: string;
}

export async function regenerateTranslation(
  options: RegenerateOptions,
): Promise<string> {
  const { contextMode, entry, glossary, locale, provider, voice } = options;
  const context = buildContext(entry, contextMode);
  return provider.translate({
    context,
    defaultLocale: '',
    fileId: entry.fileId,
    glossary,
    source: entry.source,
    targetLocale: locale,
    voice,
  });
}

function buildContext(
  entry: MessageEntry,
  mode: ContextMode,
): TranslationContext | undefined {
  if (mode === 'none') {
    return undefined;
  }
  if (mode === 'minimal') {
    return {
      componentName: entry.componentName ?? '',
      fileId: entry.fileId,
      snippet: '',
    };
  }
  return {
    componentName: entry.componentName ?? '',
    fileId: entry.fileId,
    snippet: entry.snippet ?? '',
  };
}
