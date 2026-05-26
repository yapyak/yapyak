import type { LocaleFile } from './file';

import { readLocaleFile } from './file';
import { stringifyCanonical } from './json';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

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
