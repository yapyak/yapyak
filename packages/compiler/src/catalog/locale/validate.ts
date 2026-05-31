import type { Diagnostic } from '../../parser/diagnostic';
import type { ExtractedMessage } from '../../parser/file/extract';
import type { Placeholder } from '../../parser/placeholder';
import type { LocaleFile, LocaleFileEntry } from './file';

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
      if (!isValidEntry(value)) {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK301',
            fileId: input.fileId,
            message: `Entry "${pathKey}".${JSON.stringify(source)} must be a string or an object whose values are strings.`,
            range: STUB_RANGE,
            severity: 'error',
            source: '',
          }),
        );
        continue;
      }
      diagnostics.push(...checkNfc(input.fileId, pathKey, source, value));
    }
  }
  return diagnostics;
}

export interface ValidateLengthsInput {
  fileId: string;
  localeFile: LocaleFile;
  messages: readonly ExtractedMessage[];
}

export function validateLengths(input: ValidateLengthsInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const message of input.messages) {
    for (const location of message.locations) {
      if (location.maxLength === undefined) {
        continue;
      }
      if (message.source.length > location.maxLength) {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK502',
            fileId: input.fileId,
            hint: 'Increase the `.maxLength()` value or shorten the source string.',
            message: `Source string is ${message.source.length} characters but \`.maxLength(${location.maxLength})\` is set.`,
            range: location.range,
            severity: 'warning',
            source: '',
          }),
        );
      }
      const target = readTarget(
        input.localeFile,
        location.fileId,
        message.source,
        location.tag,
      );
      if (target !== undefined && target.length > location.maxLength) {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK501',
            fileId: input.fileId,
            hint: 'Tighten the translation or relax the `.maxLength()` bound.',
            message: `Translation is ${target.length} characters but \`.maxLength(${location.maxLength})\` is set.`,
            range: location.range,
            severity: 'warning',
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
        location.tag,
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
  tag: string | undefined,
): string | undefined {
  const fileEntries = localeFile[fileId];
  if (!fileEntries) {
    return undefined;
  }
  const entry = fileEntries[source];
  if (entry === undefined) {
    return undefined;
  }
  if (typeof entry === 'string') {
    return entry === '' ? undefined : entry;
  }
  if (tag === undefined) {
    return undefined;
  }
  const tagValue = entry[tag];
  if (tagValue === undefined || tagValue === '') {
    return undefined;
  }
  return tagValue;
}

function checkNfc(
  fileId: string,
  pathKey: string,
  source: string,
  value: LocaleFileEntry,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (typeof value === 'string') {
    if (value !== value.normalize('NFC')) {
      diagnostics.push(makeNfcDiagnostic(fileId, pathKey, source));
    }
    return diagnostics;
  }
  for (const [tag, translation] of Object.entries(value)) {
    if (translation !== translation.normalize('NFC')) {
      diagnostics.push(makeNfcDiagnostic(fileId, pathKey, source, tag));
    }
  }
  return diagnostics;
}

function makeNfcDiagnostic(
  fileId: string,
  pathKey: string,
  source: string,
  tag?: string,
): Diagnostic {
  const key =
    tag === undefined
      ? `"${pathKey}".${JSON.stringify(source)}`
      : `"${pathKey}".${JSON.stringify(source)}.${tag}`;
  return createDiagnostic({
    code: 'YPK303',
    fileId,
    message: `Translation at ${key} is not Unicode NFC.`,
    range: STUB_RANGE,
    severity: 'error',
    source: '',
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidEntry(value: unknown): value is LocaleFileEntry {
  if (typeof value === 'string') {
    return true;
  }
  if (!isPlainObject(value)) {
    return false;
  }
  for (const v of Object.values(value)) {
    if (typeof v !== 'string') {
      return false;
    }
  }
  return true;
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
