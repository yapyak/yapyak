import type { LocaleEntry } from './locale';

import { collectLocaleEntries } from './locale';

export function collectUntranslatedEntries(text: string): LocaleEntry[] {
  return collectLocaleEntries(text).filter((entry) =>
    isUntranslated(text, entry),
  );
}

function isUntranslated(text: string, entry: LocaleEntry): boolean {
  return text.slice(entry.offset, entry.offset + entry.length).trim() === '';
}
