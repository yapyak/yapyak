export const SYSTEM_PROMPT = `You are a professional software localization translator. You translate user interface strings from a source language into a target language.

Rules:
- Preserve all ICU MessageFormat placeholders ({name}, {count, plural, ...}, etc.) exactly as-is.
- Preserve all formatting characters (newlines, punctuation positioning).
- Translate naturally and idiomatically for the target locale.
- Apply any provided glossary terms strictly.
- Apply any provided brand voice rules strictly.
- Output ONLY the translation, no explanations, no quotes, no commentary.`;

export const BATCH_SYSTEM_PROMPT = `You are a professional software localization translator. You translate user interface strings from a source language into a target language.

Rules:
- Preserve all ICU MessageFormat placeholders ({name}, {count, plural, ...}, etc.) exactly as-is.
- Preserve all formatting characters (newlines, punctuation positioning).
- Translate naturally and idiomatically for the target locale.
- Apply any provided glossary terms strictly.
- Apply any provided brand voice rules strictly.
- Output ONLY a JSON array of translated strings, in the same order as input. No commentary, no markdown, no code fences.`;

export interface BuildPromptOptions {
  glossary: Record<string, Record<string, string>>;
  source: string;
  targetLocale: string;
  voice: string;
}

export function buildPrompt(options: BuildPromptOptions): string {
  const { glossary, source, targetLocale, voice } = options;
  const blocks = buildContextBlocks({ glossary, targetLocale, voice });

  return `Translate this string from the source language to ${targetLocale}.${blocks}

Source string:
${source}`;
}

export interface BuildBatchPromptOptions {
  glossary: Record<string, Record<string, string>>;
  sources: string[];
  targetLocale: string;
  voice: string;
}

export function buildBatchPrompt(options: BuildBatchPromptOptions): string {
  const { glossary, sources, targetLocale, voice } = options;
  const blocks = buildContextBlocks({ glossary, targetLocale, voice });

  const numbered = sources
    .map((source, i) => `${i + 1}. ${JSON.stringify(source)}`)
    .join('\n');

  return `Translate the following ${sources.length} strings from the source language to ${targetLocale}.${blocks}

Strings (numbered):
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
