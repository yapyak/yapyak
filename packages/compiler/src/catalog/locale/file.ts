import type { ExtractedMessage } from '../../parser/file/extract';
import type { OrphanCache } from './orphan';

import { stringifyCanonical } from '../canonical';
import {
  addOrphan,
  findOrphan,
  getDefaultCacheDir,
  readOrphans,
  removeOrphan,
  writeOrphans,
} from './orphan';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type LocaleFile = Record<string, Record<string, string>>;

export interface SyncLocaleFilesOptions {
  cacheDir?: string;
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  messages: ExtractedMessage[];
  now?: () => string;
  projectRoot: string;
}

export interface WriteLocaleFileInput {
  after: LocaleFile;
  extractedSources: Record<string, Set<string>>;
  filePath: string;
}

export interface InvariantViolation {
  afterValue: string | undefined;
  beforeValue: string;
  fileId: string;
  source: string;
}

export class YapyakInvariantError extends Error {
  readonly filePath: string;
  readonly violations: InvariantViolation[];

  constructor(filePath: string, violations: InvariantViolation[]) {
    const lines = violations.map((v) => {
      const target =
        v.afterValue === undefined ? 'missing' : `"${v.afterValue}"`;
      return `  - ${v.fileId}: "${v.source}" was "${v.beforeValue}", would become ${target}`;
    });
    super(
      `[yapyak] Refusing to write ${filePath}: would silently clear ${violations.length} translation(s) for source string(s) that are still in use.\n${lines.join('\n')}`,
    );
    this.name = 'YapyakInvariantError';
    this.filePath = filePath;
    this.violations = violations;
  }
}

/**
 * Error thrown when a locale file cannot be parsed as JSON.
 *
 * @remarks
 * Yapyak refuses to silently clobber a malformed locale file. The error
 * carries the absolute path of the offending file and the underlying parse
 * error as its `cause`.
 */
export class CorruptLocaleFileError extends Error {
  readonly filePath: string;

  constructor(filePath: string, cause: unknown) {
    super(
      `[yapyak] Failed to parse locale file ${filePath}. Check the JSON syntax — yapyak will skip syncing this locale until it is fixed.`,
      { cause },
    );
    this.name = 'CorruptLocaleFileError';
    this.filePath = filePath;
  }
}

export function getLocaleFilePath(
  projectRoot: string,
  localesDir: string,
  locale: string,
): string {
  return join(projectRoot, localesDir, `${locale}.json`);
}

export function readLocaleFile(path: string): LocaleFile {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (!content.trim()) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    throw new CorruptLocaleFileError(path, cause);
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

export function writeLocaleFile(input: WriteLocaleFileInput): void {
  const before = readLocaleFile(input.filePath);
  const violations = findInvariantViolations(
    before,
    input.after,
    input.extractedSources,
  );
  if (violations.length > 0) {
    throw new YapyakInvariantError(input.filePath, violations);
  }
  mkdirSync(dirname(input.filePath), { recursive: true });
  writeFileSync(input.filePath, stringifyCanonical(input.after));
}

function findInvariantViolations(
  before: LocaleFile,
  after: LocaleFile,
  extractedSources: Record<string, Set<string>>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  for (const [fileId, beforeEntries] of Object.entries(before)) {
    const stillUsed = extractedSources[fileId];
    if (!stillUsed) {
      continue;
    }
    const afterEntries = after[fileId] ?? {};
    for (const [source, beforeValue] of Object.entries(beforeEntries)) {
      if (beforeValue === '') {
        continue;
      }
      if (!stillUsed.has(source)) {
        continue;
      }
      const afterValue = afterEntries[source];
      if (afterValue === undefined || afterValue === '') {
        violations.push({ afterValue, beforeValue, fileId, source });
      }
    }
  }
  return violations;
}

export function syncLocaleFiles(options: SyncLocaleFilesOptions): void {
  const sourcesByFile = groupSourcesByFile(options.messages);
  const extractedSources = toExtractedSourcesSet(sourcesByFile);

  const cacheDir = options.cacheDir ?? getDefaultCacheDir(options.projectRoot);
  const orphans = readOrphans(cacheDir);
  const nonDefaultLocales = options.locales.filter(
    (locale) => locale !== options.defaultLocale,
  );

  const existingByLocale = new Map<string, LocaleFile>();
  const corruptLocales = new Set<string>();
  for (const locale of nonDefaultLocales) {
    const localePath = getLocaleFilePath(
      options.projectRoot,
      options.localesDir,
      locale,
    );
    try {
      existingByLocale.set(locale, readLocaleFile(localePath));
    } catch (error) {
      if (error instanceof CorruptLocaleFileError) {
        console.warn(error.message);
        corruptLocales.add(locale);
        continue;
      }
      throw error;
    }
  }
  const healthyLocales = nonDefaultLocales.filter(
    (locale) => !corruptLocales.has(locale),
  );

  const inFlightDrops = collectInFlightDrops(
    existingByLocale,
    extractedSources,
    healthyLocales,
  );

  const nextByLocale = new Map<string, LocaleFile>();
  const restoredOrphans = new Map<string, Set<string>>();
  const restoredInFlight = new Map<string, Set<string>>();

  for (const locale of healthyLocales) {
    const existing = existingByLocale.get(locale) ?? {};
    const next: LocaleFile = {};

    for (const fileId of Object.keys(sourcesByFile).sort()) {
      const sources = sourcesByFile[fileId];
      if (!sources) {
        continue;
      }
      const existingFile = existing[fileId] ?? {};
      const fileEntries: Record<string, string> = {};
      for (const source of sources) {
        const existingValue = existingFile[source];
        if (existingValue) {
          fileEntries[source] = existingValue;
          continue;
        }
        const orphan = findOrphan(orphans, fileId, source);
        const orphanValue = orphan?.entry.translations[locale];
        if (orphan && orphanValue) {
          fileEntries[source] = orphanValue;
          recordPair(restoredOrphans, orphan.fileId, source);
          if (inFlightDrops.get(orphan.fileId)?.has(source)) {
            recordPair(restoredInFlight, orphan.fileId, source);
          }
          continue;
        }
        const inFlight = findInFlightDrop(inFlightDrops, fileId, source);
        const inFlightValue = inFlight?.translations[locale];
        if (inFlight && inFlightValue) {
          fileEntries[source] = inFlightValue;
          recordPair(restoredInFlight, inFlight.fileId, source);
          continue;
        }
        fileEntries[source] = '';
      }
      next[fileId] = fileEntries;
    }

    nextByLocale.set(locale, next);
  }

  const droppedTranslations = new Map<
    string,
    Map<string, Record<string, string>>
  >();
  for (const [fileId, bySource] of inFlightDrops) {
    for (const [source, translations] of bySource) {
      if (restoredInFlight.get(fileId)?.has(source)) {
        continue;
      }
      let nextBySource = droppedTranslations.get(fileId);
      if (!nextBySource) {
        nextBySource = new Map();
        droppedTranslations.set(fileId, nextBySource);
      }
      nextBySource.set(source, translations);
    }
  }

  const orphansChanged = applyOrphanMutations({
    droppedTranslations,
    now: options.now ?? (() => new Date().toISOString()),
    orphans,
    restoredOrphans,
  });

  if (orphansChanged) {
    writeOrphans(cacheDir, orphans);
  }

  for (const locale of healthyLocales) {
    const next = nextByLocale.get(locale) ?? {};
    const localePath = getLocaleFilePath(
      options.projectRoot,
      options.localesDir,
      locale,
    );
    writeLocaleFile({ after: next, extractedSources, filePath: localePath });
  }
}

function recordPair(
  pairs: Map<string, Set<string>>,
  fileId: string,
  source: string,
): void {
  let sources = pairs.get(fileId);
  if (!sources) {
    sources = new Set();
    pairs.set(fileId, sources);
  }
  sources.add(source);
}

type InFlightDrops = Map<string, Map<string, Record<string, string>>>;

interface InFlightDropLookup {
  fileId: string;
  translations: Record<string, string>;
}

function collectInFlightDrops(
  existingByLocale: Map<string, LocaleFile>,
  extractedSources: Record<string, Set<string>>,
  nonDefaultLocales: readonly string[],
): InFlightDrops {
  const drops: InFlightDrops = new Map();
  for (const locale of nonDefaultLocales) {
    const existing = existingByLocale.get(locale) ?? {};
    for (const [fileId, entries] of Object.entries(existing)) {
      const extractedForFile = extractedSources[fileId] ?? new Set<string>();
      for (const [source, value] of Object.entries(entries)) {
        if (!value) {
          continue;
        }
        if (extractedForFile.has(source)) {
          continue;
        }
        let bySource = drops.get(fileId);
        if (!bySource) {
          bySource = new Map();
          drops.set(fileId, bySource);
        }
        let translations = bySource.get(source);
        if (!translations) {
          translations = {};
          bySource.set(source, translations);
        }
        translations[locale] = value;
      }
    }
  }
  return drops;
}

function findInFlightDrop(
  drops: InFlightDrops,
  fileId: string,
  source: string,
): InFlightDropLookup | undefined {
  const direct = drops.get(fileId)?.get(source);
  if (direct) {
    return { fileId, translations: direct };
  }
  for (const [otherFileId, bySource] of drops) {
    const translations = bySource.get(source);
    if (translations) {
      return { fileId: otherFileId, translations };
    }
  }
  return undefined;
}

interface ApplyOrphanMutationsInput {
  droppedTranslations: Map<string, Map<string, Record<string, string>>>;
  now: () => string;
  orphans: OrphanCache;
  restoredOrphans: Map<string, Set<string>>;
}

function applyOrphanMutations(input: ApplyOrphanMutationsInput): boolean {
  let changed = false;
  for (const [fileId, sources] of input.restoredOrphans) {
    for (const source of sources) {
      if (removeOrphan(input.orphans, fileId, source)) {
        changed = true;
      }
    }
  }
  const timestamp = input.now();
  for (const [fileId, bySource] of input.droppedTranslations) {
    for (const [source, translations] of bySource) {
      addOrphan(input.orphans, fileId, source, {
        deletedAt: timestamp,
        translations,
      });
      changed = true;
    }
  }
  return changed;
}

function toExtractedSourcesSet(
  sourcesByFile: Record<string, string[]>,
): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  for (const [fileId, sources] of Object.entries(sourcesByFile)) {
    result[fileId] = new Set(sources);
  }
  return result;
}

function groupSourcesByFile(
  messages: ExtractedMessage[],
): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};
  for (const message of messages) {
    const key =
      message.context === undefined
        ? message.source
        : `${message.source}@${message.context}`;
    for (const location of message.locations) {
      let set = grouped[location.fileId];
      if (!set) {
        set = new Set<string>();
        grouped[location.fileId] = set;
      }
      set.add(key);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [fileId, set] of Object.entries(grouped)) {
    result[fileId] = [...set].sort();
  }
  return result;
}
