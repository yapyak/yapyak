export interface BuildSystemOptions {
  glossary?: Record<string, Record<string, string>>;
  voice?: string;
}

export function buildSystem(
  options: BuildSystemOptions,
  sourceLocale: string,
  targetLocales: string[],
): string {
  const targetList = targetLocales.join(', ');
  const lines: string[] = [
    `You are a professional translator. Translate the source string in each input from ${sourceLocale} into every one of these target locales: ${targetList}.`,
    'Input is a JSON array. Each item has a `source` string to translate and optional `component`, `element`, and `snippet` fields giving usage context (use them to inform tone — a `button` element wants concise imperatives, a `h1` wants strong nouns, a `label` wants direct nouns; the `snippet` shows surrounding source code when provided).',
    'An item may also have a `disambiguation` field — a short label the developer added to distinguish this occurrence of the source from other occurrences with the same English text. Use it to pick the correct sense (e.g. `button` for an action, `status` for a state) when translating.',
    'An item may also have an `examples` field — an array of prior translations from this project. Treat them as style reference: pick the same terminology and tone when the source is related (e.g. if a prior `Save` → `Spara`, prefer `Spara ändringar` for `Save changes`). Examples are hints, not constraints — deviate when the source genuinely calls for it.',
    `Output: a JSON array of objects — same length and order as the input. Each object MUST contain exactly one string-valued key per target locale (${targetList}). Do not echo any other input keys. No commentary, no markdown, no code fences, no labels. Just the JSON array.`,
    `Example for target locales \`sv, de\`: input \`[{"source": "Save"}]\` → output \`[{"sv": "Spara", "de": "Speichern"}]\`.`,
    'Preserve all {placeholder} tokens and ICU patterns exactly as written, identically in every target locale.',
  ];
  if (options.voice) {
    lines.push(`Voice: ${options.voice}`);
  }
  const glossarySection = extractGlossary(options.glossary, targetLocales);
  if (glossarySection.length > 0) {
    lines.push(
      'Use these glossary terms strictly when they appear in the source, picking the entry for the active target locale:',
    );
    for (const line of glossarySection) {
      lines.push(`  ${line}`);
    }
  }
  return lines.join('\n');
}

function extractGlossary(
  glossary: BuildSystemOptions['glossary'],
  targetLocales: string[],
): string[] {
  if (!glossary) {
    return [];
  }
  const lines: string[] = [];
  for (const [source, perLocale] of Object.entries(glossary)) {
    const pairs: string[] = [];
    for (const locale of targetLocales) {
      const translation = perLocale[locale];
      if (typeof translation === 'string' && translation) {
        pairs.push(`${locale}="${translation}"`);
      }
    }
    if (pairs.length > 0) {
      lines.push(`"${source}" → ${pairs.join(', ')}`);
    }
  }
  return lines;
}

export function stripCodeFence(text: string): string {
  if (!text.startsWith('```')) {
    return text;
  }
  const lines = text.split('\n');
  const start = lines[0]?.startsWith('```') ? 1 : 0;
  const end =
    lines[lines.length - 1] === '```' ? lines.length - 1 : lines.length;
  return lines.slice(start, end).join('\n');
}
