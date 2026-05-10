import { join } from 'node:path';
import type { Rename } from './detect-renames.js';
import {
  type LocaleFile,
  readLocaleFile,
  writeLocaleFile,
} from './sync-locale-files.js';

export interface MigrateLocalesOptions {
  defaultLocale: string;
  fileId: string;
  locales: string[];
  localesDir: string;
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
      `${locale}.yml`,
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
        next[rename.to] = previousValue ?? '';
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

export function markStale(
  options: Pick<MigrateLocalesOptions, 'fileId' | 'locales' | 'localesDir' | 'projectRoot' | 'defaultLocale'> & {
    sources: string[];
  },
): void {
  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.yml`,
    );
    const data = readLocaleFile(localePath);
    const fileEntries = data[options.fileId];
    if (fileEntries === undefined) {
      continue;
    }
    let changed = false;
    for (const source of options.sources) {
      if (Object.hasOwn(fileEntries, source) && fileEntries[source] !== '') {
        fileEntries[source] = '';
        changed = true;
      }
    }
    if (changed) {
      data[options.fileId] = fileEntries;
      writeLocaleFile(localePath, data);
    }
  }
}
