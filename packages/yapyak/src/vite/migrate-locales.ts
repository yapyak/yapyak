import type { Rename } from './detect-renames.ts';

import { readLocaleFile, writeLocaleFile } from './sync-locale-files.ts';
import { join } from 'node:path';

export interface MigrateLocalesOptions {
  defaultLocale: string;
  fileId: string;
  locales: string[];
  localesDir: string;
  preserveTranslations: boolean;
  projectRoot: string;
  renames: Rename[];
}

export interface MigrationResult {
  staleEntries: Array<{ locale: string; source: string }>;
}

export function migrateLocales(
  options: MigrateLocalesOptions,
): MigrationResult {
  const staleEntries: MigrationResult['staleEntries'] = [];
  if (options.renames.length === 0) {
    return { staleEntries };
  }

  for (const locale of options.locales) {
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    const data = readLocaleFile(localePath);
    const fileEntries = data[options.fileId];
    if (fileEntries === undefined) {
      continue;
    }
    let changed = false;
    const isDefault = locale === options.defaultLocale;
    const next: Record<string, string> = { ...fileEntries };
    for (const rename of options.renames) {
      if (!Object.hasOwn(next, rename.from)) {
        continue;
      }
      const previousValue = next[rename.from];
      delete next[rename.from];
      if (isDefault) {
        next[rename.to] = rename.to;
      } else {
        next[rename.to] = options.preserveTranslations
          ? (previousValue ?? '')
          : '';
        staleEntries.push({ locale, source: rename.to });
      }
      changed = true;
    }
    if (changed) {
      data[options.fileId] = next;
      writeLocaleFile(localePath, data);
    }
  }
  return { staleEntries };
}
