import type { Diagnostic, ExtractedMessage, Placeholder } from '../../parser';
import type { LocaleFile } from './file';

import { parsePlaceholders, toMessageKey } from '../../parser';
import { existsSync, readFileSync } from 'node:fs';

const STUB_RANGE = {
  end: {
    column: 0,
    line: 1,
    offset: 0,
  },
  start: {
    column: 0,
    line: 1,
    offset: 0,
  },
};

export function validateLocaleFile(fileId: string, path: string): Diagnostic[] {
  if (!existsSync(path)) {
    return [];
  }
  const content = readFileSync(path, 'utf-8');
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
      diagnostics.push({
        code: 'YPK302',
        fileId,
        message: `Unsafe file-path key "${pathKey}" — must be relative, use forward slashes, and contain no ".." segments.`,
        range: STUB_RANGE,
        severity: 'error',
        source: '',
      });
    }
    if (!isPlainObject(entries)) {
      diagnostics.push({
        code: 'YPK301',
        fileId,
        message: `Entries under "${pathKey}" must be an object mapping source to translation.`,
        range: STUB_RANGE,
        severity: 'error',
        source: '',
      });
      continue;
    }
    for (const [source, value] of Object.entries(entries)) {
      if (source !== source.normalize('NFC')) {
        diagnostics.push({
          code: 'YPK303',
          fileId,
          message: `Source key at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC — it will not match extracted source strings.`,
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        });
      }
      if (typeof value !== 'string') {
        diagnostics.push({
          code: 'YPK301',
          fileId,
          message: `Entry "${pathKey}".${JSON.stringify(source)} must be a string.`,
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        });
        continue;
      }
      if (value !== value.normalize('NFC')) {
        diagnostics.push({
          code: 'YPK303',
          fileId,
          message: `Translation at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC.`,
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        });
      }
    }
  }
  return diagnostics;
}

export type TranslationParityIssue = {
  kind: 'missing' | 'extra' | 'kind-mismatch';
  name: string;
  sourceKind?: Placeholder['kind'];
  targetKind?: Placeholder['kind'];
};

export type TranslationParityResult = {
  issues: TranslationParityIssue[];
  ok: boolean;
};

export function validateTranslationParity(
  source: string,
  target: string,
): TranslationParityResult {
  const sourceByName = buildPlaceholderIndex(
    parsePlaceholders(source).placeholders,
  );
  const targetByName = buildPlaceholderIndex(
    parsePlaceholders(target).placeholders,
  );
  const issues: TranslationParityIssue[] = [];
  for (const [name, placeholder] of sourceByName) {
    const targetPlaceholder = targetByName.get(name);
    if (!targetPlaceholder) {
      issues.push({
        kind: 'missing',
        name,
        sourceKind: placeholder.kind,
      });
      continue;
    }
    if (targetPlaceholder.kind !== placeholder.kind) {
      issues.push({
        kind: 'kind-mismatch',
        name,
        sourceKind: placeholder.kind,
        targetKind: targetPlaceholder.kind,
      });
    }
  }
  for (const name of targetByName.keys()) {
    if (!sourceByName.has(name)) {
      issues.push({
        kind: 'extra',
        name,
      });
    }
  }
  return {
    issues,
    ok: issues.length === 0,
  };
}

export function validateIcuPairs(
  fileId: string,
  localeFile: LocaleFile,
  messages: ExtractedMessage[],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const message of messages) {
    const sourcePlaceholders = parsePlaceholders(message.source).placeholders;
    const sourceByName = buildPlaceholderIndex(sourcePlaceholders);
    const key = toMessageKey(message.source, message.context);
    for (const location of message.locations) {
      const target = readTarget(localeFile, location.fileId, key);
      if (target === undefined) {
        continue;
      }
      const targetPlaceholders = parsePlaceholders(target).placeholders;
      const targetByName = buildPlaceholderIndex(targetPlaceholders);

      for (const [name, placeholder] of sourceByName) {
        if (!targetByName.has(name)) {
          diagnostics.push({
            code: 'YPK205',
            fileId,
            hint: `Include \`{${name}}\` in the translation.`,
            message: `Placeholder \`{${name}}\` is in the source but missing from the translation.`,
            range: location.range,
            severity: 'error',
            source: '',
          });
          continue;
        }
        const targetPlaceholder = targetByName.get(name);
        if (targetPlaceholder && targetPlaceholder.kind !== placeholder.kind) {
          diagnostics.push({
            code: 'YPK204',
            fileId,
            hint: `Match the placeholder kind \`${placeholder.kind}\` from the source.`,
            message: `Placeholder \`{${name}}\` is \`${placeholder.kind}\` in the source but \`${targetPlaceholder.kind}\` in the translation.`,
            range: location.range,
            severity: 'error',
            source: '',
          });
        }
      }
      for (const name of targetByName.keys()) {
        if (!sourceByName.has(name)) {
          diagnostics.push({
            code: 'YPK206',
            fileId,
            hint: `Remove \`{${name}}\` from the translation or add it to the source.`,
            message: `Placeholder \`{${name}}\` is in the translation but missing from the source.`,
            range: location.range,
            severity: 'error',
            source: '',
          });
        }
      }
    }
  }
  return diagnostics;
}

function buildPlaceholderIndex(
  placeholders: Placeholder[],
): Map<string, Placeholder> {
  const placeholdersByName = new Map<string, Placeholder>();
  for (const placeholder of placeholders) {
    placeholdersByName.set(placeholder.name, placeholder);
  }
  return placeholdersByName;
}

function readTarget(
  localeFile: LocaleFile,
  fileId: string,
  key: string,
): string | undefined {
  const fileEntries = localeFile[fileId];
  if (!fileEntries) {
    return undefined;
  }
  const entry = fileEntries[key];
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
