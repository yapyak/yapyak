import type { LocaleContext } from './context';
import type { CatalogEntry } from './file';

import { readLocaleFile, writeLocaleFile } from './file';
import { join } from 'node:path';

export type MessagePosition = {
  column: number;
  line: number;
  source: string;
};

export type RenameEntry = {
  from: string;
  to: string;
};

export type MigrateLocalesInput = {
  extractedKeys: Record<string, Set<string>>;
  fileId: string;
  renames: RenameEntry[];
};

export type MigrateLocalesOptions = {
  preserveTranslations?: boolean;
};

export type MigrateLocalesResult = {
  staleEntries: {
    locale: string;
    source: string;
  }[];
};

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
    renames.push({
      from: oldEntry.source,
      to: candidate,
    });
    claimedAdded.add(candidate);
  }

  return renames;
}

export function migrateLocales(
  input: MigrateLocalesInput,
  context: LocaleContext,
  projectRoot: string,
  options?: MigrateLocalesOptions,
): MigrateLocalesResult {
  const staleEntries: MigrateLocalesResult['staleEntries'] = [];
  if (input.renames.length === 0) {
    return {
      staleEntries,
    };
  }

  const preserveTranslations = options?.preserveTranslations ?? false;

  for (const locale of context.locales) {
    if (locale === context.defaultLocale) {
      continue;
    }
    const localePath = join(projectRoot, context.localesDir, `${locale}.json`);
    const localeFile = readLocaleFile(localePath);
    const fileEntries = localeFile[input.fileId];
    if (!fileEntries) {
      continue;
    }
    let hasChanged = false;
    const next: Record<string, CatalogEntry> = {
      ...fileEntries,
    };
    for (const rename of input.renames) {
      if (!Object.hasOwn(next, rename.from)) {
        continue;
      }
      const previousValue = next[rename.from];
      delete next[rename.from];
      next[rename.to] = preserveTranslations ? (previousValue ?? '') : '';
      staleEntries.push({
        locale,
        source: rename.to,
      });
      hasChanged = true;
    }
    if (hasChanged) {
      localeFile[input.fileId] = next;
      writeLocaleFile({
        after: localeFile,
        extractedKeys: input.extractedKeys,
        filePath: localePath,
      });
    }
  }
  return {
    staleEntries,
  };
}

function toPositionKey(entry: MessagePosition): string {
  return `${entry.line}:${entry.column}`;
}
