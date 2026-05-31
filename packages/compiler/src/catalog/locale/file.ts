import type { ExtractedMessage } from '../../parser/file/extract';

import { stringifyCanonical } from '../canonical';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type LocaleFileEntry = string | Record<string, string>;

export type LocaleFile = Record<string, Record<string, LocaleFileEntry>>;

export interface SyncLocaleFilesOptions {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  messages: ExtractedMessage[];
  projectRoot: string;
}

export interface WriteLocaleFileInput {
  after: LocaleFile;
  extractedSources: Record<string, Set<string>>;
  filePath: string;
}

export interface InvariantViolation {
  afterValue: LocaleFileEntry | undefined;
  beforeValue: LocaleFileEntry;
  fileId: string;
  source: string;
  tag?: string;
}

export class YapyakInvariantError extends Error {
  readonly filePath: string;
  readonly violations: InvariantViolation[];

  constructor(filePath: string, violations: InvariantViolation[]) {
    const lines = violations.map((v) => {
      const target =
        v.afterValue === undefined ? 'missing' : formatEntry(v.afterValue);
      const key =
        v.tag === undefined ? `"${v.source}"` : `"${v.source}".${v.tag}`;
      return `  - ${v.fileId}: ${key} was ${formatEntry(v.beforeValue)}, would become ${target}`;
    });
    super(
      `[yapyak] Refusing to write ${filePath}: would silently clear ${violations.length} translation(s) for source string(s) that are still in use.\n${lines.join('\n')}`,
    );
    this.name = 'YapyakInvariantError';
    this.filePath = filePath;
    this.violations = violations;
  }
}

function formatEntry(value: LocaleFileEntry): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return JSON.stringify(value);
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
    const fileEntries: Record<string, LocaleFileEntry> = {};
    for (const [source, value] of Object.entries(entries)) {
      if (typeof value === 'string') {
        fileEntries[source] = value;
        continue;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const tagEntries: Record<string, string> = {};
        for (const [tag, translation] of Object.entries(value)) {
          if (typeof translation === 'string') {
            tagEntries[tag] = translation;
          }
        }
        if (Object.keys(tagEntries).length > 0) {
          fileEntries[source] = tagEntries;
        }
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
      if (isEmptyEntry(beforeValue)) {
        continue;
      }
      if (!stillUsed.has(source)) {
        continue;
      }
      const afterValue = afterEntries[source];
      if (afterValue === undefined || isEmptyEntry(afterValue)) {
        violations.push({ afterValue, beforeValue, fileId, source });
        continue;
      }
      if (typeof beforeValue === 'object' && typeof afterValue === 'object') {
        for (const [tag, beforeTagValue] of Object.entries(beforeValue)) {
          if (beforeTagValue === '') {
            continue;
          }
          const afterTagValue = afterValue[tag];
          if (afterTagValue === undefined || afterTagValue === '') {
            violations.push({
              afterValue,
              beforeValue,
              fileId,
              source,
              tag,
            });
          }
        }
      }
    }
  }
  return violations;
}

function isEmptyEntry(value: LocaleFileEntry): boolean {
  if (typeof value === 'string') {
    return value === '';
  }
  for (const translation of Object.values(value)) {
    if (translation !== '') {
      return false;
    }
  }
  return true;
}

export function syncLocaleFiles(options: SyncLocaleFilesOptions): void {
  const shape = groupSourcesByFile(options.messages);
  const extractedSources = toExtractedSourcesSet(shape);

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

    for (const fileId of Object.keys(shape).sort()) {
      const sourceShape = shape[fileId];
      if (!sourceShape) {
        continue;
      }
      const existingFile = existing[fileId] ?? {};
      const fileEntries: Record<string, LocaleFileEntry> = {};
      for (const source of Object.keys(sourceShape).sort()) {
        const tags = sourceShape[source];
        const existingValue = existingFile[source];
        fileEntries[source] = buildEntry(tags ?? null, existingValue);
      }
      next[fileId] = fileEntries;
    }

    if (Object.keys(next).length === 0 && Object.keys(existing).length > 0) {
      console.warn(
        `[yapyak] Refusing to overwrite ${localePath}: extracted 0 messages but existing file has content. This usually indicates an extraction failure. Delete the file manually if you intended to empty it.`,
      );
      continue;
    }

    writeLocaleFile({ after: next, extractedSources, filePath: localePath });
  }
}

function buildEntry(
  tags: readonly string[] | null,
  existing: LocaleFileEntry | undefined,
): LocaleFileEntry {
  if (tags === null) {
    if (typeof existing === 'string') {
      return existing;
    }
    return '';
  }
  const entry: Record<string, string> = {};
  for (const tag of tags) {
    const previous =
      existing && typeof existing === 'object' ? existing[tag] : undefined;
    entry[tag] = typeof previous === 'string' ? previous : '';
  }
  return entry;
}

function toExtractedSourcesSet(
  shape: Record<string, Record<string, string[] | null>>,
): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  for (const [fileId, sources] of Object.entries(shape)) {
    result[fileId] = new Set(Object.keys(sources));
  }
  return result;
}

function groupSourcesByFile(
  messages: ExtractedMessage[],
): Record<string, Record<string, string[] | null>> {
  const tagsByFile: Record<string, Record<string, Set<string> | null>> = {};
  for (const message of messages) {
    for (const location of message.locations) {
      let bySource = tagsByFile[location.fileId];
      if (!bySource) {
        bySource = {};
        tagsByFile[location.fileId] = bySource;
      }
      if (location.tag === undefined) {
        if (!(message.source in bySource)) {
          bySource[message.source] = null;
        }
        continue;
      }
      let tagSet = bySource[message.source];
      if (!tagSet || tagSet instanceof Set === false) {
        tagSet = new Set<string>();
        bySource[message.source] = tagSet;
      }
      tagSet.add(location.tag);
    }
  }
  const result: Record<string, Record<string, string[] | null>> = {};
  for (const [fileId, bySource] of Object.entries(tagsByFile)) {
    const sourceShape: Record<string, string[] | null> = {};
    for (const [source, tagSet] of Object.entries(bySource)) {
      sourceShape[source] = tagSet === null ? null : [...tagSet].sort();
    }
    result[fileId] = sourceShape;
  }
  return result;
}
