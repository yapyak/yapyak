import type { ExtractedMessage } from '../../parser/type';

import { stringifyCanonical } from '../canonical';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type LocaleFile = Record<string, Record<string, string>>;

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
      if (!sources) {
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

    if (Object.keys(next).length === 0 && Object.keys(existing).length > 0) {
      console.warn(
        `[yapyak] Refusing to overwrite ${localePath}: extracted 0 messages but existing file has content. This usually indicates an extraction failure. Delete the file manually if you intended to empty it.`,
      );
      continue;
    }

    writeLocaleFile({ after: next, extractedSources, filePath: localePath });
  }
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
    for (const location of message.locations) {
      let set = grouped[location.fileId];
      if (!set) {
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
