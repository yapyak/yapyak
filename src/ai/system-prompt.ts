import type { TranslationContext } from './types.js';

export const SYSTEM_PROMPT = `You are a professional software localization translator. You translate user interface strings from a source language into a target language.

Rules:
- Preserve all ICU MessageFormat placeholders ({name}, {count, plural, ...}, etc.) exactly as-is.
- Preserve all formatting characters (newlines, punctuation positioning).
- Translate naturally and idiomatically for the target locale.
- When call-site context is provided, use it to disambiguate meaning. The same English string may translate differently depending on whether it labels a button, a heading, an aria-label, or appears in body text.
- Apply any provided glossary terms strictly.
- Apply any provided brand voice rules strictly.
- Output ONLY the translation, no explanations, no quotes, no commentary.`;

export const BATCH_SYSTEM_PROMPT = `You are a professional software localization translator. You translate user interface strings from a source language into a target language.

Rules:
- Preserve all ICU MessageFormat placeholders ({name}, {count, plural, ...}, etc.) exactly as-is.
- Preserve all formatting characters (newlines, punctuation positioning).
- Translate naturally and idiomatically for the target locale.
- When call-site context is provided for an entry, use it to disambiguate meaning. The same English string may translate differently depending on whether it labels a button, a heading, an aria-label, or appears in body text.
- Apply any provided glossary terms strictly.
- Apply any provided brand voice rules strictly.
- Output ONLY a JSON array of translated strings, in the same order as input. No commentary, no markdown, no code fences.`;

export interface BuildPromptOptions {
  context?: TranslationContext | undefined;
  glossary: Record<string, Record<string, string>>;
  source: string;
  targetLocale: string;
  voice: string;
}

export function buildPrompt(options: BuildPromptOptions): string {
  const { context, glossary, source, targetLocale, voice } = options;
  const blocks = buildContextBlocks({ glossary, targetLocale, voice });
  const callSite = context ? buildCallSiteBlock(context) : '';

  return `Translate this string from the source language to ${targetLocale}.${blocks}${callSite}

Source string:
${source}`;
}

export interface BuildBatchPromptOptions {
  contexts?: TranslationContext[] | undefined;
  glossary: Record<string, Record<string, string>>;
  sources: string[];
  targetLocale: string;
  voice: string;
}

export function buildBatchPrompt(options: BuildBatchPromptOptions): string {
  const { contexts, glossary, sources, targetLocale, voice } = options;
  const blocks = buildContextBlocks({ glossary, targetLocale, voice });

  const numbered = sources
    .map((source, i) => {
      const context = contexts?.[i];
      const literal = JSON.stringify(source);
      if (!context) {
        return `${i + 1}. ${literal}`;
      }
      return `${i + 1}. ${literal}\n${indent(buildCallSiteBlock(context, false), '   ')}`;
    })
    .join('\n');

  return `Translate the following ${sources.length} strings from the source language to ${targetLocale}.${blocks}

Strings (numbered, with call-site context where available):
${numbered}

Output: a JSON array of ${sources.length} translated strings, in the same order. Example: ["...", "...", "..."]`;
}

interface ContextOptions {
  glossary: Record<string, Record<string, string>>;
  targetLocale: string;
  voice: string;
}

function buildContextBlocks(options: ContextOptions): string {
  const { glossary, targetLocale, voice } = options;
  const glossaryLines: string[] = [];
  for (const [term, locales] of Object.entries(glossary)) {
    const translation = locales[targetLocale];
    if (translation) {
      glossaryLines.push(`  "${term}" → "${translation}"`);
    }
  }
  const glossaryBlock =
    glossaryLines.length > 0
      ? `\n\nGlossary (apply strictly):\n${glossaryLines.join('\n')}`
      : '';
  const voiceBlock = voice.trim() ? `\n\nBrand voice:\n${voice.trim()}` : '';
  return `${voiceBlock}${glossaryBlock}`;
}

function buildCallSiteBlock(
  context: TranslationContext,
  withHeader = true,
): string {
  const lines: string[] = [];
  if (withHeader) {
    lines.push('', '', 'Call-site context:');
  } else {
    lines.push('Context:');
  }
  lines.push(`  File: ${context.fileId}`);
  if (context.componentName) {
    lines.push(`  Component: ${context.componentName}`);
  }
  if (context.snippet.trim()) {
    lines.push('  Surrounding code:');
    for (const row of context.snippet.split('\n')) {
      lines.push(`    ${row}`);
    }
  }
  return lines.join('\n');
}

function indent(value: string, prefix: string): string {
  return value
    .split('\n')
    .map((row) => (row.length === 0 ? row : prefix + row))
    .join('\n');
}
