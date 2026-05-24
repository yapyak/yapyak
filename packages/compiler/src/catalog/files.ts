import type { ExtractedMessage } from '../parser/type';

import { stringifyCanonical } from './json';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

/** @internal */
export type LocaleFile = Record<string, Record<string, string>>;

/** @internal */
export interface LocaleData {
  [locale: string]: {
    [fileId: string]: { [source: string]: string };
  };
}

export interface SyncLocaleFilesOptions {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  messages: ExtractedMessage[];
  projectRoot: string;
}

export interface DiscoverLocalesOptions {
  defaultLocale?: string;
  localesDir: string;
  projectRoot: string;
}

export interface DiscoverLocalesResult {
  defaultLocale: string;
  locales: string[];
}

export interface ReadLocaleDataOptions {
  locales: string[];
  localesDir: string;
  projectRoot: string;
}

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

export function syncLocaleFiles(options: SyncLocaleFilesOptions): void {
  const sourcesByFile = groupSourcesByFile(options.messages);

  for (const locale of options.locales) {
    if (locale === options.defaultLocale) {
      continue;
    }
    const localePath = getLocaleFilePath(
      options.projectRoot,
      options.localesDir,
      locale,
    );
    const existing = readLocaleFile(localePath);
    const next: LocaleFile = {};

    for (const fileId of Object.keys(sourcesByFile).sort()) {
      const sources = sourcesByFile[fileId];
      if (sources === undefined) {
        continue;
      }
      const existingFile = existing[fileId] ?? {};
      const fileEntries: Record<string, string> = {};
      for (const source of sources) {
        const value = existingFile[source];
        fileEntries[source] = typeof value === 'string' ? value : '';
      }
      next[fileId] = fileEntries;
    }

    writeLocaleFile(localePath, next);
  }
}

export function getLocaleFilePath(
  projectRoot: string,
  localesDir: string,
  locale: string,
): string {
  return join(projectRoot, localesDir, `${locale}.json`);
}

/** @internal */
export function readLocaleFile(path: string): LocaleFile {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (content.trim() === '') {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  const result: LocaleFile = {};
  for (const [fileId, entries] of Object.entries(parsed)) {
    if (typeof entries !== 'object' || entries === null) {
      continue;
    }
    const fileEntries: Record<string, string> = {};
    for (const [source, value] of Object.entries(entries)) {
      if (typeof value === 'string') {
        fileEntries[source] = value;
      }
    }
    result[fileId] = fileEntries;
  }
  return result;
}

export function writeLocaleFile(path: string, data: LocaleFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringifyCanonical(data));
}

export function discoverLocales(
  options: DiscoverLocalesOptions,
): DiscoverLocalesResult {
  const dir = join(options.projectRoot, options.localesDir);
  const fileLocales = existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
        .sort()
    : [];
  const defaultLocale =
    options.defaultLocale !== undefined && options.defaultLocale !== ''
      ? options.defaultLocale
      : 'en';
  const set = new Set<string>([defaultLocale, ...fileLocales]);
  const locales = [...set].sort();
  return { defaultLocale, locales };
}

export function readLocaleData(options: ReadLocaleDataOptions): LocaleData {
  const data: LocaleData = {};
  for (const locale of options.locales) {
    data[locale] = readLocaleFile(
      join(options.projectRoot, options.localesDir, `${locale}.json`),
    );
  }
  return data;
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
    if (fileEntries === undefined) {
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
      writeLocaleFile(localePath, data);
    }
  }
  return { staleEntries };
}

function groupSourcesByFile(
  messages: ExtractedMessage[],
): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};
  for (const message of messages) {
    for (const location of message.locations) {
      let set = grouped[location.fileId];
      if (set === undefined) {
        set = new Set<string>();
        grouped[location.fileId] = set;
      }
      set.add(message.source);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [fileId, set] of Object.entries(grouped)) {
    result[fileId] = [...set].sort();
  }
  return result;
}

function toPositionKey(entry: MessagePosition): string {
  return `${entry.line}:${entry.column}`;
}
