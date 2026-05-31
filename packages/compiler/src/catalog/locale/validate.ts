import type { Diagnostic } from '../../parser/diagnostic';
import type { ExtractedMessage } from '../../parser/file/extract';
import type { Placeholder } from '../../parser/placeholder';
import type { LocaleFile } from './file';

import { createDiagnostic } from '../../parser/diagnostic';
import { parsePlaceholders } from '../../parser/placeholder';
import { existsSync, readFileSync } from 'node:fs';

const STUB_RANGE = {
  end: { column: 0, line: 1, offset: 0 },
  start: { column: 0, line: 1, offset: 0 },
};

export interface ValidateLocaleFileInput {
  fileId: string;
  path: string;
}

export function validateLocaleFile(
  input: ValidateLocaleFileInput,
): Diagnostic[] {
  if (!existsSync(input.path)) {
    return [];
  }
  const content = readFileSync(input.path, 'utf-8');
  if (content.trim() === '') {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  if (!isPlainObject(parsed)) {
    return [];
  }
  const diagnostics: Diagnostic[] = [];
  for (const [pathKey, entries] of Object.entries(parsed)) {
    if (isUnsafePath(pathKey)) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK302',
          fileId: input.fileId,
          message: `Unsafe file-path key "${pathKey}" — must be relative, use forward slashes, and contain no ".." segments.`,
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        }),
      );
    }
    if (!isPlainObject(entries)) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK301',
          fileId: input.fileId,
          message: `Entries under "${pathKey}" must be an object mapping source to translation.`,
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        }),
      );
      continue;
    }
    for (const [source, value] of Object.entries(entries)) {
      if (typeof value !== 'string') {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK301',
            fileId: input.fileId,
            message: `Entry "${pathKey}".${JSON.stringify(source)} must be a string.`,
            range: STUB_RANGE,
            severity: 'error',
            source: '',
          }),
        );
        continue;
      }
      if (value !== value.normalize('NFC')) {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK303',
            fileId: input.fileId,
            message: `Translation at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC.`,
            range: STUB_RANGE,
            severity: 'error',
            source: '',
          }),
        );
      }
    }
  }
  return diagnostics;
}

export interface ValidateIcuPairsInput {
  fileId: string;
  localeFile: LocaleFile;
  messages: readonly ExtractedMessage[];
}

export function validateIcuPairs(input: ValidateIcuPairsInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const message of input.messages) {
    const sourcePlaceholders = parsePlaceholders(message.source).placeholders;
    const sourceByName = byName(sourcePlaceholders);
    for (const location of message.locations) {
      const target = readTarget(
        input.localeFile,
        location.fileId,
        message.source,
      );
      if (target === undefined) {
        continue;
      }
      const targetPlaceholders = parsePlaceholders(target).placeholders;
      const targetByName = byName(targetPlaceholders);

      for (const [name, placeholder] of sourceByName) {
        if (!targetByName.has(name)) {
          diagnostics.push(
            createDiagnostic({
              code: 'YPK205',
              fileId: input.fileId,
              hint: `Include \`{${name}}\` in the translation.`,
              message: `Placeholder \`{${name}}\` is in the source but missing from the translation.`,
              range: location.range,
              severity: 'error',
              source: '',
            }),
          );
          continue;
        }
        const targetPlaceholder = targetByName.get(name);
        if (targetPlaceholder && targetPlaceholder.kind !== placeholder.kind) {
          diagnostics.push(
            createDiagnostic({
              code: 'YPK204',
              fileId: input.fileId,
              hint: `Match the placeholder kind \`${placeholder.kind}\` from the source.`,
              message: `Placeholder \`{${name}}\` is \`${placeholder.kind}\` in the source but \`${targetPlaceholder.kind}\` in the translation.`,
              range: location.range,
              severity: 'error',
              source: '',
            }),
          );
        }
      }
      for (const name of targetByName.keys()) {
        if (!sourceByName.has(name)) {
          diagnostics.push(
            createDiagnostic({
              code: 'YPK206',
              fileId: input.fileId,
              hint: `Remove \`{${name}}\` from the translation or add it to the source.`,
              message: `Placeholder \`{${name}}\` is in the translation but missing from the source.`,
              range: location.range,
              severity: 'error',
              source: '',
            }),
          );
        }
      }
    }
  }
  return diagnostics;
}

function byName(
  placeholders: readonly Placeholder[],
): Map<string, Placeholder> {
  const map = new Map<string, Placeholder>();
  for (const placeholder of placeholders) {
    map.set(placeholder.name, placeholder);
  }
  return map;
}

function readTarget(
  localeFile: LocaleFile,
  fileId: string,
  source: string,
): string | undefined {
  const fileEntries = localeFile[fileId];
  if (!fileEntries) {
    return undefined;
  }
  const entry = fileEntries[source];
  if (entry === undefined || entry === '') {
    return undefined;
  }
  return entry;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnsafePath(path: string): boolean {
  if (path === '') {
    return true;
  }
  if (path.includes('\\')) {
    return true;
  }
  if (path.startsWith('/')) {
    return true;
  }
  if (/^[a-zA-Z]:/.test(path)) {
    return true;
  }
  const segments = path.split('/');
  for (const segment of segments) {
    if (segment === '..') {
      return true;
    }
  }
  return false;
}
