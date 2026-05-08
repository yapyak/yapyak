export const SYSTEM_PROMPT = `You are a professional software localization translator. You translate user interface strings from a source language into a target language.

Rules:
- Preserve all ICU MessageFormat placeholders ({name}, {count, plural, ...}, etc.) exactly as-is.
- Preserve all formatting characters (newlines, punctuation positioning).
- Translate naturally and idiomatically for the target locale.
- Apply any provided glossary terms strictly.
- Apply any provided brand voice rules strictly.
- Output ONLY the translation, no explanations, no quotes, no commentary.`;

export interface BuildPromptOptions {
  glossary: Record<string, Record<string, string>>;
  source: string;
  targetLocale: string;
  voice: string;
}

export function buildPrompt(options: BuildPromptOptions): string {
  const { glossary, source, targetLocale, voice } = options;
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

  return `Translate this string from the source language to ${targetLocale}.${voiceBlock}${glossaryBlock}

Source string:
${source}`;
}
