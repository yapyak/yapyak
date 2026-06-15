import type { Diagnostic, ExtractedMessage, Placeholder } from '../../parser';
import type { LocaleFile, ParseEntryError } from './file';

import { YAP } from '../../../diagnostics/codes';
import { parsePlaceholders } from '../../parser';
import { stripBom } from './bom';
import { findTranslation, parseEntry } from './file';
import { isPlainObject } from './plain-object';
import { isUnsafeKey } from './unsafe-key';
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
  const content = stripBom(readFileSync(path, 'utf-8'));
  if (content.trim() === '') {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    return [
      {
        code: YAP.CATALOG_INVALID_JSON,
        fileId,
        message: `Locale file is not valid JSON. ${detail}.`,
        range: STUB_RANGE,
        severity: 'error',
        source: '',
      },
    ];
  }
  if (!isPlainObject(parsed)) {
    return [];
  }
  const diagnostics: Diagnostic[] = [];
  for (const [pathKey, entries] of Object.entries(parsed)) {
    if (isUnsafePath(pathKey)) {
      diagnostics.push({
        code: YAP.CATALOG_UNSAFE_PATH,
        fileId,
        message: `Unsafe file-path key "${pathKey}". Paths must be relative, use forward slashes, and contain no ".." segments.`,
        range: STUB_RANGE,
        severity: 'error',
        source: '',
      });
    }
    if (!isPlainObject(entries)) {
      diagnostics.push({
        code: YAP.CATALOG_INVALID_SHAPE,
        fileId,
        message: `Entries under "${pathKey}" are not an object mapping source to translation.`,
        range: STUB_RANGE,
        severity: 'error',
        source: '',
      });
      continue;
    }
    for (const [source, value] of Object.entries(entries)) {
      if (source !== source.normalize('NFC')) {
        diagnostics.push({
          code: YAP.CATALOG_NOT_NFC,
          fileId,
          message: `Source key at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC. It will not match extracted source strings.`,
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        });
      }
      const { entry, errors } = parseEntry(value);
      for (const error of errors) {
        diagnostics.push({
          code: YAP.CATALOG_INVALID_SHAPE,
          fileId,
          message: entryErrorMessage(error, pathKey, source),
          range: STUB_RANGE,
          severity: 'error',
          source: '',
        });
      }
      if (typeof entry === 'string') {
        if (entry !== entry.normalize('NFC')) {
          diagnostics.push({
            code: YAP.CATALOG_NOT_NFC,
            fileId,
            message: `Translation at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC.`,
            range: STUB_RANGE,
            severity: 'error',
            source: '',
          });
        }
        continue;
      }
      if (entry === undefined) {
        continue;
      }
      for (const [context, translation] of Object.entries(entry)) {
        if (translation !== translation.normalize('NFC')) {
          diagnostics.push({
            code: YAP.CATALOG_NOT_NFC,
            fileId,
            message: `Translation at "${pathKey}".${JSON.stringify(source)}.${JSON.stringify(context)} is not Unicode NFC.`,
            range: STUB_RANGE,
            severity: 'error',
            source: '',
          });
        }
      }
    }
  }
  return diagnostics;
}

function entryErrorMessage(
  error: ParseEntryError,
  pathKey: string,
  source: string,
): string {
  const path = `"${pathKey}".${JSON.stringify(source)}`;
  if (error.kind === 'value-not-string-or-object') {
    return `Entry ${path} must be a string or a context-variant object with string values.`;
  }
  if (error.kind === 'context-value-not-string') {
    return `Entry ${path}.${JSON.stringify(error.context)} must be a string.`;
  }
  return `Entry ${path} has no string values — supply at least one context variant.`;
}

export type TranslationParityResult = {
  issues: {
    kind: 'missing' | 'extra' | 'kind-mismatch';
    name: string;
    sourceKind?: Placeholder['kind'];
    targetKind?: Placeholder['kind'];
  }[];
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
  const issues: TranslationParityResult['issues'] = [];
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
    for (const location of message.locations) {
      const target = findTranslation(
        localeFile[location.fileId]?.[message.source],
        message.context,
      );
      if (target === undefined || target === '') {
        continue;
      }
      const targetPlaceholders = parsePlaceholders(target).placeholders;
      const targetByName = buildPlaceholderIndex(targetPlaceholders);

      for (const [name, placeholder] of sourceByName) {
        if (!targetByName.has(name)) {
          diagnostics.push({
            code: YAP.PLACEHOLDER_MISSING_IN_TARGET,
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
            code: YAP.PLACEHOLDER_KIND_MISMATCH,
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
            code: YAP.PLACEHOLDER_MISSING_IN_SOURCE,
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

function isUnsafePath(path: string): boolean {
  if (path === '') {
    return true;
  }
  if (isUnsafeKey(path)) {
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
