import { readLocaleFile, writeLocaleFile } from './file';
import { join } from 'node:path';

export interface MessagePosition {
  column: number;
  line: number;
  source: string;
}

export interface RenameEntry {
  from: string;
  to: string;
}

export interface MigrateLocalesOptions {
  defaultLocale: string;
  extractedSources: Record<string, Set<string>>;
  fileId: string;
  locales: string[];
  localesDir: string;
  preserveTranslations: boolean;
  projectRoot: string;
  renames: RenameEntry[];
}

export interface MigrateLocalesResult {
  staleEntries: Array<{ locale: string; source: string }>;
}

export function detectRenames(
  oldEntries: MessagePosition[],
  newEntries: MessagePosition[],
): RenameEntry[] {
  const oldSources = new Set<string>();
  for (const entry of oldEntries) {
    oldSources.add(entry.source);
  }
  const newSources = new Set<string>();
  for (const entry of newEntries) {
    newSources.add(entry.source);
  }

  const removed = new Set<string>();
  for (const source of oldSources) {
    if (!newSources.has(source)) {
      removed.add(source);
    }
  }

  const added = new Set<string>();
  for (const source of newSources) {
    if (!oldSources.has(source)) {
      added.add(source);
    }
  }

  if (removed.size === 0 || added.size === 0) {
    return [];
  }

  const newByPosition = new Map<string, string>();
  for (const entry of newEntries) {
    if (added.has(entry.source)) {
      newByPosition.set(toPositionKey(entry), entry.source);
    }
  }

  const renames: RenameEntry[] = [];
  const claimedAdded = new Set<string>();

  for (const oldEntry of oldEntries) {
    if (!removed.has(oldEntry.source)) {
      continue;
    }
    const candidate = newByPosition.get(toPositionKey(oldEntry));
    if (candidate === undefined) {
      continue;
    }
    if (claimedAdded.has(candidate)) {
      continue;
    }
    renames.push({ from: oldEntry.source, to: candidate });
    claimedAdded.add(candidate);
  }

  return renames;
}

export function migrateLocales(
  options: MigrateLocalesOptions,
): MigrateLocalesResult {
  const staleEntries: MigrateLocalesResult['staleEntries'] = [];
  if (options.renames.length === 0) {
    return { staleEntries };
  }

  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    const data = readLocaleFile(localePath);
    const fileEntries = data[options.fileId];
    if (!fileEntries) {
      continue;
    }
    let hasChanged = false;
    const next: Record<string, string> = { ...fileEntries };
    for (const rename of options.renames) {
      if (!Object.hasOwn(next, rename.from)) {
        continue;
      }
      const previousValue = next[rename.from];
      delete next[rename.from];
      next[rename.to] = options.preserveTranslations
        ? (previousValue ?? '')
        : '';
      staleEntries.push({ locale, source: rename.to });
      hasChanged = true;
    }
    if (hasChanged) {
      data[options.fileId] = next;
      writeLocaleFile({
        after: data,
        extractedSources: options.extractedSources,
        filePath: localePath,
      });
    }
  }
  return { staleEntries };
}

function toPositionKey(entry: MessagePosition): string {
  return `${entry.line}:${entry.column}`;
}
