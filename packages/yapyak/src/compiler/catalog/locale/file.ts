import type { ExtractedMessage } from '../../parser';
import type { LocaleContext } from './context';
import type { OrphanCache } from './orphan';

import { toMessageKey } from '../../parser';
import { compareKeys, stringifyCanonical } from '../canonical';
import { validateLocaleCode } from './code';
import {
  addOrphan,
  findOrphan,
  getDefaultYapyakDir,
  readOrphans,
  removeOrphan,
  writeOrphans,
} from './orphan';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type LocaleFile = Record<string, Record<string, string>>;

export interface SyncLocaleFilesInput {
  filter: (fileId: string) => boolean;
  messages: ExtractedMessage[];
}

export interface SyncLocaleFilesOptions {
  now?: () => string;
  yapyakDir?: string;
}

export interface SyncEntry {
  fileId: string;
  locale: string;
  source: string;
}

export interface SyncLocaleFilesResult {
  orphaned: SyncEntry[];
  restored: SyncEntry[];
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
  filePath: string;
  violations: InvariantViolation[];

  constructor(filePath: string, violations: InvariantViolation[]) {
    const lines = violations.map((violation) => {
      const target =
        violation.afterValue === undefined
          ? 'missing'
          : `"${violation.afterValue}"`;
      return `  - ${violation.fileId}: "${violation.source}" was "${violation.beforeValue}", would become ${target}`;
    });
    super(
      `[yapyak] Refusing to write ${filePath}: would silently clear ${violations.length} translation(s) for source string(s) that are still in use.\n${lines.join('\n')}`,
    );
    this.name = 'YapyakInvariantError';
    this.filePath = filePath;
    this.violations = violations;
  }
}

export class CorruptLocaleFileError extends Error {
  filePath: string;

  constructor(filePath: string, cause: unknown) {
    super(
      `[yapyak] Failed to parse locale file ${filePath}. Fix the JSON syntax to proceed.`,
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

export function writeLocaleFiles(writes: WriteLocaleFileInput[]): void {
  for (const write of writes) {
    const before = readLocaleFile(write.filePath);
    const violations = findInvariantViolations(
      before,
      write.after,
      write.extractedSources,
    );
    if (violations.length > 0) {
      throw new YapyakInvariantError(write.filePath, violations);
    }
  }
  for (const write of writes) {
    mkdirSync(dirname(write.filePath), { recursive: true });
    writeFileSync(write.filePath, stringifyCanonical(write.after));
  }
}

export function writeLocaleFile(input: WriteLocaleFileInput): void {
  writeLocaleFiles([input]);
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

export function syncLocaleFiles(
  input: SyncLocaleFilesInput,
  context: LocaleContext,
  projectRoot: string,
  options?: SyncLocaleFilesOptions,
): SyncLocaleFilesResult {
  const sourcesByFile = groupSourcesByFile(input.messages);
  const extractedSources = toExtractedSourcesSet(sourcesByFile);

  const yapyakDir = options?.yapyakDir ?? getDefaultYapyakDir(projectRoot);
  const orphans = readOrphans(yapyakDir);
  const nonDefaultLocales = context.locales.filter(
    (locale) =>
      locale !== context.defaultLocale && validateLocaleCode(locale).valid,
  );

  const existingByLocale = new Map<string, LocaleFile>();
  const corruptLocales = new Set<string>();
  for (const locale of nonDefaultLocales) {
    const localePath = getLocaleFilePath(
      projectRoot,
      context.localesDir,
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

  const inFlightDrops = extractInFlightDrops(
    existingByLocale,
    extractedSources,
    input.filter,
    healthyLocales,
  );

  const nextByLocale = new Map<string, LocaleFile>();
  const restoredOrphans = new Map<string, Set<string>>();
  const restoredInFlight = new Map<string, Set<string>>();
  const restored: SyncEntry[] = [];

  for (const locale of healthyLocales) {
    const existing = existingByLocale.get(locale) ?? {};
    const next: LocaleFile = {};

    for (const [fileId, entries] of Object.entries(existing)) {
      if (input.filter(fileId)) {
        continue;
      }
      next[fileId] = entries;
    }

    for (const fileId of Object.keys(sourcesByFile).sort(compareKeys)) {
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
          registerPair(restoredOrphans, orphan.fileId, source);
          if (inFlightDrops.get(orphan.fileId)?.has(source)) {
            registerPair(restoredInFlight, orphan.fileId, source);
          }
          restored.push({ fileId, locale, source });
          continue;
        }
        const inFlight = findInFlightDrop(inFlightDrops, fileId, source);
        const inFlightValue = inFlight?.translations[locale];
        if (inFlight && inFlightValue) {
          fileEntries[source] = inFlightValue;
          registerPair(restoredInFlight, inFlight.fileId, source);
          restored.push({ fileId, locale, source });
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
  const orphaned: SyncEntry[] = [];
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
      for (const locale of Object.keys(translations)) {
        orphaned.push({ fileId, locale, source });
      }
    }
  }

  const orphansChanged = applyOrphanMutations(
    droppedTranslations,
    options?.now ?? (() => new Date().toISOString()),
    orphans,
    restoredOrphans,
  );

  if (orphansChanged) {
    writeOrphans(yapyakDir, orphans);
  }

  const writes: WriteLocaleFileInput[] = [];
  for (const locale of healthyLocales) {
    const next = nextByLocale.get(locale) ?? {};
    const localePath = getLocaleFilePath(
      projectRoot,
      context.localesDir,
      locale,
    );
    writes.push({ after: next, extractedSources, filePath: localePath });
  }
  writeLocaleFiles(writes);

  return { orphaned, restored };
}

function registerPair(
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

function extractInFlightDrops(
  existingByLocale: Map<string, LocaleFile>,
  extractedSources: Record<string, Set<string>>,
  filter: (fileId: string) => boolean,
  nonDefaultLocales: string[],
): InFlightDrops {
  const drops: InFlightDrops = new Map();
  for (const locale of nonDefaultLocales) {
    const existing = existingByLocale.get(locale) ?? {};
    for (const [fileId, entries] of Object.entries(existing)) {
      if (!filter(fileId)) {
        continue;
      }
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

function applyOrphanMutations(
  droppedTranslations: Map<string, Map<string, Record<string, string>>>,
  now: () => string,
  orphans: OrphanCache,
  restoredOrphans: Map<string, Set<string>>,
): boolean {
  let hasChanged = false;
  for (const [fileId, sources] of restoredOrphans) {
    for (const source of sources) {
      if (removeOrphan(orphans, fileId, source)) {
        hasChanged = true;
      }
    }
  }
  const timestamp = now();
  for (const [fileId, bySource] of droppedTranslations) {
    for (const [source, translations] of bySource) {
      addOrphan(orphans, fileId, source, {
        deletedAt: timestamp,
        translations,
      });
      hasChanged = true;
    }
  }
  return hasChanged;
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
    const key = toMessageKey(message.source, message.context);
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
