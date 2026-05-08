import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface LoadTranslationsOptions {
  locale: string;
  localesDir: string;
  projectRoot: string;
}

export type Translations = Record<string, Record<string, string>>;

export function loadTranslations(
  options: LoadTranslationsOptions,
): Translations {
  const { locale, localesDir, projectRoot } = options;
  const path = join(projectRoot, localesDir, `${locale}.json`);
  if (!existsSync(path)) {
    return {};
  }
  const raw = readFileSync(path, 'utf8');
  if (raw.trim() === '') {
    return {};
  }
  return JSON.parse(raw);
}
