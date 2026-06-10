import type { LocaleWarning } from 'yapyak/compiler';

export function renderLocaleWarning(
  warning: LocaleWarning,
  localesDir: string,
): string {
  const reason =
    warning.issue === 'invalid-structure'
      ? 'does not look like a BCP 47 locale tag'
      : 'is not a recognized ISO 639-1 language code';
  const action =
    'yapyak will skip syncing stubs and translating for this locale.';
  const hint = warning.suggestion
    ? ` Did you mean '${warning.suggestion}'? Rename \`${localesDir}/${warning.code}.json\` to \`${localesDir}/${warning.suggestion}.json\` to enable.`
    : ` Rename \`${localesDir}/${warning.code}.json\` to a valid locale code, or remove the file.`;
  return `[yapyak] locale '${warning.code}' ${reason}. ${action}${hint}`;
}
