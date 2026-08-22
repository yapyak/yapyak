import type { Template } from '../../../template/internal';
import type { Diagnostic, ExtractedMessage } from '../../parser';
import type { Placeholder } from '../../placeholder';
import type { ParseEntryError } from './file';

import { buildDiagnostic } from '../../../diagnostic';
import { toMessageKey } from '../../../message-key';
import { resolvePluralCategories } from '../../../plural-category';
import { parseTemplate } from '../../../template/internal';
import { classifyNames } from '../../name';
import { findMalformedIssue, parsePlaceholders } from '../../placeholder';
import { stripBom } from './bom';
import { findEntryRange } from './entry-range';
import { findTranslation, parseEntry, parseLocaleFile } from './file';
import { isPlainObject } from './plain-object';
import { isUnsafeKey } from './unsafe-key';
import { existsSync, readFileSync } from 'node:fs';

type BranchKind = 'plural' | 'selectordinal' | 'select';

type BranchEntry = {
  branches: Set<string>;
  kind: BranchKind;
};

type BranchesByName = Map<string, BranchEntry>;

const EXACT_MATCH_RX = /^=\d+$/;

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
  const stubContext = {
    fileId,
    range: STUB_RANGE,
    severity: 'error' as const,
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    return [
      buildDiagnostic(
        'CATALOG_INVALID_JSON',
        {
          detail,
        },
        stubContext,
      ),
    ];
  }
  if (!isPlainObject(parsed)) {
    return [];
  }
  const diagnostics: Diagnostic[] = [];
  for (const [pathKey, entries] of Object.entries(parsed)) {
    if (isUnsafePath(pathKey)) {
      diagnostics.push(
        buildDiagnostic(
          'CATALOG_UNSAFE_PATH',
          {
            pathKey,
          },
          stubContext,
        ),
      );
    }
    if (!isPlainObject(entries)) {
      diagnostics.push(
        buildDiagnostic(
          'CATALOG_INVALID_SHAPE',
          {
            detail: `Entries under "${pathKey}" are not an object mapping source to translation.`,
          },
          stubContext,
        ),
      );
      continue;
    }
    for (const [source, value] of Object.entries(entries)) {
      if (source !== source.normalize('NFC')) {
        diagnostics.push(
          buildDiagnostic(
            'CATALOG_NOT_NFC',
            {
              detail: `Source key at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC. It will not match extracted source strings.`,
            },
            stubContext,
          ),
        );
      }
      const { entry, errors } = parseEntry(value);
      for (const error of errors) {
        diagnostics.push(
          buildDiagnostic(
            'CATALOG_INVALID_SHAPE',
            {
              detail: formatEntryErrorMessage(error, pathKey, source),
            },
            stubContext,
          ),
        );
      }
      if (typeof entry === 'string') {
        if (entry !== entry.normalize('NFC')) {
          diagnostics.push(
            buildDiagnostic(
              'CATALOG_NOT_NFC',
              {
                detail: `Translation at "${pathKey}".${JSON.stringify(source)} is not Unicode NFC.`,
              },
              stubContext,
            ),
          );
        }
        continue;
      }
      if (entry === undefined) {
        continue;
      }
      for (const [context, translation] of Object.entries(entry)) {
        if (translation !== translation.normalize('NFC')) {
          diagnostics.push(
            buildDiagnostic(
              'CATALOG_NOT_NFC',
              {
                detail: `Translation at "${pathKey}".${JSON.stringify(source)}.${JSON.stringify(context)} is not Unicode NFC.`,
              },
              stubContext,
            ),
          );
        }
      }
    }
  }
  return diagnostics;
}

function formatEntryErrorMessage(
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
  return `Entry ${path} has no string values. Supply at least one context variant.`;
}

export type TranslationParityResult = {
  issues: {
    branch?: string;
    categories?: string[];
    kind:
      | 'missing'
      | 'extra'
      | 'kind-mismatch'
      | 'missing-other-branch'
      | 'missing-select-branch'
      | 'unknown-branch';
    name: string;
    sourceKind?: Placeholder['kind'];
    targetKind?: Placeholder['kind'];
  }[];
  ok: boolean;
};

export function validateTranslationParity(
  source: string,
  target: string,
  locale: string,
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
  const sourceBranchesByName = extractBranchesByName(source);
  const targetBranchesByName = extractBranchesByName(target);
  for (const [name, sourceEntry] of sourceBranchesByName) {
    const targetEntry = targetBranchesByName.get(name);
    if (!targetEntry || targetEntry.kind !== sourceEntry.kind) {
      continue;
    }
    if (!targetEntry.branches.has('other')) {
      issues.push({
        kind: 'missing-other-branch',
        name,
      });
    }
    if (sourceEntry.kind === 'select') {
      for (const branch of sourceEntry.branches) {
        if (!targetEntry.branches.has(branch)) {
          issues.push({
            branch,
            kind: 'missing-select-branch',
            name,
          });
        }
      }
    }
  }
  for (const [name, targetEntry] of targetBranchesByName) {
    if (targetEntry.kind === 'select') {
      continue;
    }
    const categories = resolvePluralCategories(
      locale,
      targetEntry.kind === 'selectordinal' ? 'ordinal' : 'cardinal',
    );
    if (categories === undefined) {
      continue;
    }
    for (const branch of targetEntry.branches) {
      if (EXACT_MATCH_RX.test(branch) || categories.includes(branch)) {
        continue;
      }
      issues.push({
        branch,
        categories,
        kind: 'unknown-branch',
        name,
      });
    }
  }
  return {
    issues,
    ok: issues.length === 0,
  };
}

export type ValidateEntryUsageInput = {
  content: string;
  fileId: string;
  messages: ExtractedMessage[];
  sourceFileIds: string[];
};

export function validateEntryUsage(
  input: ValidateEntryUsageInput,
): Diagnostic[] {
  const content = stripBom(input.content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  if (!isPlainObject(parsed)) {
    return [];
  }
  const localeFile = parseLocaleFile(parsed);
  const keysByFile = new Map<string, Set<string>>();
  for (const message of input.messages) {
    const key = toMessageKey(message.source, message.context);
    for (const location of message.locations) {
      let keys = keysByFile.get(location.fileId);
      if (keys === undefined) {
        keys = new Set();
        keysByFile.set(location.fileId, keys);
      }
      keys.add(key);
    }
  }
  const known = new Set(input.sourceFileIds);
  const diagnostics: Diagnostic[] = [];
  for (const [pathKey, entries] of Object.entries(localeFile)) {
    if (!known.has(pathKey)) {
      continue;
    }
    const keys = keysByFile.get(pathKey) ?? new Set<string>();
    for (const [source, entry] of Object.entries(entries)) {
      const contexts =
        typeof entry === 'string'
          ? [
              undefined,
            ]
          : Object.keys(entry);
      for (const context of contexts) {
        if (keys.has(toMessageKey(source, context))) {
          continue;
        }
        diagnostics.push(
          buildDiagnostic(
            'CATALOG_ENTRY_UNUSED',
            {
              pathKey,
              source,
            },
            {
              fileId: input.fileId,
              range:
                findEntryRange(content, pathKey, source, context) ?? STUB_RANGE,
              severity: 'warning',
            },
          ),
        );
      }
    }
  }
  return diagnostics;
}

export type ValidateIcuPairsInput = {
  content: string;
  fileId: string;
  locale: string;
  messages: ExtractedMessage[];
};

export function validateIcuPairs(input: ValidateIcuPairsInput): Diagnostic[] {
  const { fileId, locale, messages } = input;
  const content = stripBom(input.content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  if (!isPlainObject(parsed)) {
    return [];
  }
  const localeFile = parseLocaleFile(parsed);
  const diagnostics: Diagnostic[] = [];
  const categoriesCache = new Map<
    NonNullable<Intl.PluralRulesOptions['type']>,
    string[] | undefined
  >();
  const resolveCategories = (
    type: NonNullable<Intl.PluralRulesOptions['type']>,
  ): string[] | undefined => {
    if (!categoriesCache.has(type)) {
      categoriesCache.set(type, resolvePluralCategories(locale, type));
    }
    return categoriesCache.get(type);
  };
  for (const message of messages) {
    const parsedSource = parsePlaceholders(message.source);
    if (findMalformedIssue(parsedSource.issues) !== undefined) {
      continue;
    }
    const sourceByName = buildPlaceholderIndex(parsedSource.placeholders);
    const seen = new Set<string>();
    for (const location of message.locations) {
      if (seen.has(location.fileId)) {
        continue;
      }
      seen.add(location.fileId);
      const target = findTranslation(
        localeFile[location.fileId]?.[message.source],
        message.context,
      );
      if (target === undefined || target === '') {
        continue;
      }
      const diagnosticContext = {
        fileId,
        range:
          findEntryRange(
            content,
            location.fileId,
            message.source,
            message.context,
          ) ?? STUB_RANGE,
        severity: 'error' as const,
      };
      const parsedTarget = parsePlaceholders(target);
      const malformedIssue = findMalformedIssue(parsedTarget.issues);
      if (malformedIssue !== undefined) {
        diagnostics.push(
          buildDiagnostic(
            'PLACEHOLDER_MALFORMED_IN_TARGET',
            {
              detail: malformedIssue.message,
            },
            diagnosticContext,
          ),
        );
        continue;
      }
      const targetByName = buildPlaceholderIndex(parsedTarget.placeholders);

      for (const [name, placeholder] of sourceByName) {
        const targetPlaceholder = targetByName.get(name);
        if (targetPlaceholder && targetPlaceholder.kind !== placeholder.kind) {
          diagnostics.push(
            buildDiagnostic(
              'PLACEHOLDER_KIND_MISMATCH',
              {
                name,
                sourceKind: placeholder.kind,
                targetKind: targetPlaceholder.kind,
              },
              diagnosticContext,
            ),
          );
        }
      }
      const names = classifyNames(
        [
          ...sourceByName.keys(),
        ],
        [
          ...targetByName.keys(),
        ],
      );
      for (const rename of names.renames) {
        diagnostics.push(
          buildDiagnostic(
            'PLACEHOLDER_MISSPELLED_IN_TARGET',
            {
              source: rename.to,
              target: rename.from,
            },
            diagnosticContext,
          ),
        );
      }
      for (const name of names.missing) {
        diagnostics.push(
          buildDiagnostic(
            'PLACEHOLDER_MISSING_IN_TARGET',
            {
              name,
            },
            diagnosticContext,
          ),
        );
      }
      for (const name of names.extra) {
        diagnostics.push(
          buildDiagnostic(
            'PLACEHOLDER_MISSING_IN_SOURCE',
            {
              name,
            },
            diagnosticContext,
          ),
        );
      }
      const sourceBranchesByName = extractBranchesByName(message.source);
      const targetBranchesByName = extractBranchesByName(target);
      for (const [name, sourceEntry] of sourceBranchesByName) {
        const targetEntry = targetBranchesByName.get(name);
        if (!targetEntry || targetEntry.kind !== sourceEntry.kind) {
          continue;
        }
        if (!targetEntry.branches.has('other')) {
          diagnostics.push(
            buildDiagnostic(
              'PLACEHOLDER_MISSING_OTHER',
              {
                name,
              },
              diagnosticContext,
            ),
          );
        }
        if (sourceEntry.kind === 'select') {
          for (const branch of sourceEntry.branches) {
            if (!targetEntry.branches.has(branch)) {
              diagnostics.push(
                buildDiagnostic(
                  'PLACEHOLDER_BRANCH_MISSING_IN_TARGET',
                  {
                    branch,
                    name,
                  },
                  diagnosticContext,
                ),
              );
            }
          }
        }
      }
      for (const [name, targetEntry] of targetBranchesByName) {
        if (targetEntry.kind === 'select') {
          continue;
        }
        const isOrdinal = targetEntry.kind === 'selectordinal';
        const categories = resolveCategories(
          isOrdinal ? 'ordinal' : 'cardinal',
        );
        if (categories === undefined) {
          continue;
        }
        for (const branch of targetEntry.branches) {
          if (EXACT_MATCH_RX.test(branch) || categories.includes(branch)) {
            continue;
          }
          diagnostics.push(
            buildDiagnostic(
              'PLACEHOLDER_BRANCH_UNKNOWN',
              {
                branch,
                categories,
                kind: isOrdinal ? 'ordinal' : 'plural',
                locale,
                name,
              },
              diagnosticContext,
            ),
          );
        }
      }
    }
  }
  return diagnostics;
}

function extractBranchesByName(source: string): BranchesByName {
  const { template } = parseTemplate(source);
  const branchesByName: BranchesByName = new Map();
  walkForBranches(template, branchesByName);
  return branchesByName;
}

function walkForBranches(
  template: Template,
  branchesByName: BranchesByName,
): void {
  for (const node of template) {
    if (node.kind === 'plural') {
      if (!branchesByName.has(node.name)) {
        branchesByName.set(node.name, {
          branches: new Set(Object.keys(node.branches)),
          kind: node.pluralKind === 'ordinal' ? 'selectordinal' : 'plural',
        });
      }
      for (const branch of Object.values(node.branches)) {
        walkForBranches(branch, branchesByName);
      }
    } else if (node.kind === 'select') {
      if (!branchesByName.has(node.name)) {
        branchesByName.set(node.name, {
          branches: new Set(Object.keys(node.branches)),
          kind: 'select',
        });
      }
      for (const branch of Object.values(node.branches)) {
        walkForBranches(branch, branchesByName);
      }
    }
  }
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
