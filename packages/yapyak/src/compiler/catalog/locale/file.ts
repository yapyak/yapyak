import type { ExtractedMessage } from '../../parser';
import type { LocaleContext } from './context';
import type { OrphanCache } from './orphan';

import { YAP_COMPILE, warnDiagnostic } from '../../../diagnostic';
import { toMessageKey } from '../../parser';
import { compareKeys, stringifyCanonical } from '../canonical';
import { writeAtomicAll } from './atomic';
import { stripBom } from './bom';
import { validateLocaleCode } from './code';
import {
  CorruptOrphanCacheError,
  addOrphan,
  findOrphan,
  getDefaultYapyakDir,
  readOrphans,
  removeOrphan,
  writeOrphans,
} from './orphan';
import { isPlainObject } from './plain-object';
import { isUnsafeKey } from './unsafe-key';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type CatalogEntry = string | Record<string, string>;

export type LocaleFile = Record<string, Record<string, CatalogEntry>>;

export type SyncLocaleFilesInput = {
  filter: (fileId: string) => boolean;
  messages: ExtractedMessage[];
};

export type SyncLocaleFilesOptions = {
  now?: () => string;
  yapyakDir?: string;
};

type SyncEntry = {
  fileId: string;
  locale: string;
  source: string;
};

export type SyncLocaleFilesResult = {
  orphaned: SyncEntry[];
  restored: SyncEntry[];
};

export type WriteLocaleFileInput = {
  after: LocaleFile;
  extractedKeys: Record<string, Set<string>>;
  filePath: string;
};

export type InvariantViolation = {
  afterValue: string | undefined;
  beforeValue: string;
  context?: string;
  fileId: string;
  source: string;
};

export class YapyakInvariantError extends Error {
  filePath: string;
  violations: InvariantViolation[];

  constructor(filePath: string, violations: InvariantViolation[]) {
    const lines = violations.map((violation) => {
      const target =
        violation.afterValue === undefined
          ? 'missing'
          : `"${violation.afterValue}"`;
      const label =
        violation.context === undefined
          ? `"${violation.source}"`
          : `"${violation.source}" (${violation.context})`;
      return `  - ${violation.fileId}: ${label} was "${violation.beforeValue}", would become ${target}`;
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
      {
        cause,
      },
    );
    this.name = 'CorruptLocaleFileError';
    this.filePath = filePath;
  }
}

function getLocaleFilePath(
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
  const content = stripBom(readFileSync(path, 'utf-8'));
  if (!content.trim()) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    throw new CorruptLocaleFileError(path, cause);
  }
  return parseLocaleFile(parsed);
}

export function parseLocaleFile(parsed: unknown): LocaleFile {
  if (!isPlainObject(parsed)) {
    return Object.create(null);
  }
  const result: LocaleFile = Object.create(null);
  for (const [fileId, entries] of Object.entries(parsed)) {
    if (isUnsafeKey(fileId)) {
      continue;
    }
    if (!isPlainObject(entries)) {
      continue;
    }
    const fileEntries: Record<string, CatalogEntry> = Object.create(null);
    for (const [source, value] of Object.entries(entries)) {
      const { entry } = parseEntry(value);
      if (entry !== undefined) {
        fileEntries[source.normalize()] = entry;
      }
    }
    result[fileId] = fileEntries;
  }
  return result;
}

export type ParseEntryError =
  | {
      kind: 'value-not-string-or-object';
    }
  | {
      context: string;
      kind: 'context-value-not-string';
    }
  | {
      kind: 'object-has-no-string-values';
    };

export type ParseEntryResult = {
  entry: CatalogEntry | undefined;
  errors: ParseEntryError[];
};

export function parseEntry(value: unknown): ParseEntryResult {
  if (typeof value === 'string') {
    return {
      entry: value,
      errors: [],
    };
  }
  if (!isPlainObject(value)) {
    return {
      entry: undefined,
      errors: [
        {
          kind: 'value-not-string-or-object',
        },
      ],
    };
  }
  const variants: Record<string, string> = Object.create(null);
  const errors: ParseEntryError[] = [];
  for (const [context, translation] of Object.entries(value)) {
    if (typeof translation === 'string') {
      variants[context.normalize()] = translation;
      continue;
    }
    errors.push({
      context,
      kind: 'context-value-not-string',
    });
  }
  if (Object.keys(variants).length === 0) {
    if (errors.length === 0) {
      errors.push({
        kind: 'object-has-no-string-values',
      });
    }
    return {
      entry: undefined,
      errors,
    };
  }
  return {
    entry: variants,
    errors,
  };
}

function writeLocaleFiles(writes: WriteLocaleFileInput[]): void {
  for (const write of writes) {
    const before = readLocaleFile(write.filePath);
    const violations = findInvariantViolations(
      before,
      write.after,
      write.extractedKeys,
    );
    if (violations.length > 0) {
      throw new YapyakInvariantError(write.filePath, violations);
    }
  }
  for (const write of writes) {
    mkdirSync(dirname(write.filePath), {
      recursive: true,
    });
  }
  writeAtomicAll(
    writes.map((write) => ({
      content: stringifyCanonical(write.after),
      path: write.filePath,
    })),
  );
}

export function writeLocaleFile(input: WriteLocaleFileInput): void {
  writeLocaleFiles([
    input,
  ]);
}

function findInvariantViolations(
  before: LocaleFile,
  after: LocaleFile,
  extractedKeys: Record<string, Set<string>>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  for (const [fileId, beforeEntries] of Object.entries(before)) {
    const stillUsed = extractedKeys[fileId];
    if (!stillUsed) {
      continue;
    }
    const afterEntries = after[fileId];
    for (const [source, beforeEntry] of Object.entries(beforeEntries)) {
      for (const { context, value } of toVariants(beforeEntry)) {
        if (value === '') {
          continue;
        }
        if (!stillUsed.has(toMessageKey(source, context))) {
          continue;
        }
        const afterValue = findTranslation(afterEntries?.[source], context);
        if (afterValue === undefined || afterValue === '') {
          violations.push({
            afterValue,
            beforeValue: value,
            fileId,
            source,
            ...(context === undefined
              ? {}
              : {
                  context,
                }),
          });
        }
      }
    }
  }
  return violations;
}

export function toVariants(entry: CatalogEntry): {
  context?: string;
  value: string;
}[] {
  if (typeof entry === 'string') {
    return [
      {
        value: entry,
      },
    ];
  }
  return Object.entries(entry).map(([context, value]) => ({
    context,
    value,
  }));
}

export function findTranslation(
  entry: CatalogEntry | undefined,
  context?: string,
): string | undefined {
  if (entry === undefined) {
    return undefined;
  }
  if (typeof entry === 'string') {
    return context === undefined ? entry : undefined;
  }
  if (context === undefined) {
    return undefined;
  }
  return Object.hasOwn(entry, context) ? entry[context] : undefined;
}

export function syncLocaleFiles(
  input: SyncLocaleFilesInput,
  context: LocaleContext,
  projectRoot: string,
  options?: SyncLocaleFilesOptions,
): SyncLocaleFilesResult {
  const extractedByFile = toExtractedByFile(input.messages);
  const extractedKeys = toExtractedKeySet(extractedByFile);

  const yapyakDir = options?.yapyakDir ?? getDefaultYapyakDir(projectRoot);
  let orphans: ReturnType<typeof readOrphans>;
  try {
    orphans = readOrphans(yapyakDir);
  } catch (error) {
    if (error instanceof CorruptOrphanCacheError) {
      warnDiagnostic('CATALOG_ORPHAN_CACHE_CORRUPT', {
        detail: error.message,
      });
      orphans = {};
    } else {
      throw error;
    }
  }
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
        warnDiagnostic('CATALOG_LOCALE_FILE_CORRUPT', {
          detail: error.message,
        });
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
    extractedKeys,
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

    for (const fileId of Object.keys(extractedByFile).sort(compareKeys)) {
      const variants = extractedByFile[fileId];
      if (!variants) {
        continue;
      }
      const existingFile = existing[fileId];
      const byContextBySource = new Map<
        string,
        Map<string | undefined, string>
      >();
      for (const { context: variantContext, source } of variants) {
        const key = toMessageKey(source, variantContext);
        let value =
          findTranslation(existingFile?.[source], variantContext) ?? '';
        if (value === '') {
          const orphan = findOrphan(orphans, fileId, key);
          const orphanValue = orphan?.entry.translations[locale];
          if (orphan && orphanValue) {
            value = orphanValue;
            registerPair(restoredOrphans, orphan.fileId, key);
            if (inFlightDrops.get(orphan.fileId)?.has(key)) {
              registerPair(restoredInFlight, orphan.fileId, key);
            }
            restored.push({
              fileId,
              locale,
              source,
            });
          } else {
            const inFlight = findInFlightDrop(inFlightDrops, fileId, key);
            const inFlightValue = inFlight?.translations[locale];
            if (inFlight && inFlightValue) {
              value = inFlightValue;
              registerPair(restoredInFlight, inFlight.fileId, key);
              restored.push({
                fileId,
                locale,
                source,
              });
            }
          }
        }
        let byContext = byContextBySource.get(source);
        if (!byContext) {
          byContext = new Map();
          byContextBySource.set(source, byContext);
        }
        byContext.set(variantContext, value);
      }
      const fileEntries: Record<string, CatalogEntry> = Object.create(null);
      for (const [source, byContext] of byContextBySource) {
        fileEntries[source] = toEntry(byContext, source);
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
  for (const [fileId, byKey] of inFlightDrops) {
    for (const [key, drop] of byKey) {
      if (restoredInFlight.get(fileId)?.has(key)) {
        continue;
      }
      let nextByKey = droppedTranslations.get(fileId);
      if (!nextByKey) {
        nextByKey = new Map();
        droppedTranslations.set(fileId, nextByKey);
      }
      nextByKey.set(key, drop.translations);
      for (const locale of Object.keys(drop.translations)) {
        orphaned.push({
          fileId,
          locale,
          source: drop.source,
        });
      }
    }
  }

  const hasOrphansChanged = mergeOrphans(
    droppedTranslations,
    options?.now ?? (() => new Date().toISOString()),
    orphans,
    restoredOrphans,
  );

  const writes: WriteLocaleFileInput[] = [];
  for (const locale of healthyLocales) {
    const next = nextByLocale.get(locale) ?? {};
    const localePath = getLocaleFilePath(
      projectRoot,
      context.localesDir,
      locale,
    );
    writes.push({
      after: next,
      extractedKeys,
      filePath: localePath,
    });
  }
  writeLocaleFiles(writes);

  if (hasOrphansChanged) {
    writeOrphans(yapyakDir, orphans);
  }

  return {
    orphaned,
    restored,
  };
}

function registerPair(
  pairs: Map<string, Set<string>>,
  fileId: string,
  key: string,
): void {
  let keys = pairs.get(fileId);
  if (!keys) {
    keys = new Set();
    pairs.set(fileId, keys);
  }
  keys.add(key);
}

export function toEntry(
  byContext: Map<string | undefined, string>,
  source: string,
): CatalogEntry {
  const plain = byContext.get(undefined);
  if (plain !== undefined && byContext.size === 1) {
    return plain;
  }
  if (plain !== undefined) {
    throw new Error(
      `[yapyak] ${YAP_COMPILE.CONTEXT_MIXED_USAGE.code}: Source "${source}" is used with both \`t()\` and \`t.as()\`. Choose one form for every occurrence: either drop \`t.as\` or wrap every call with it. Run \`yapyak check\` to find the conflicting call sites.`,
    );
  }
  const variants: Record<string, string> = Object.create(null);
  for (const [context, value] of byContext) {
    if (context !== undefined) {
      variants[context] = value;
    }
  }
  return variants;
}

type ExtractedVariant = {
  context?: string;
  source: string;
};

type InFlightDrop = {
  source: string;
  translations: Record<string, string>;
};

type InFlightDrops = Map<string, Map<string, InFlightDrop>>;

type InFlightDropLookup = {
  fileId: string;
  translations: Record<string, string>;
};

function extractInFlightDrops(
  existingByLocale: Map<string, LocaleFile>,
  extractedKeys: Record<string, Set<string>>,
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
      const extractedForFile = extractedKeys[fileId] ?? new Set<string>();
      for (const [source, entry] of Object.entries(entries)) {
        for (const { context, value } of toVariants(entry)) {
          if (value === '') {
            continue;
          }
          const key = toMessageKey(source, context);
          if (extractedForFile.has(key)) {
            continue;
          }
          let byKey = drops.get(fileId);
          if (!byKey) {
            byKey = new Map();
            drops.set(fileId, byKey);
          }
          let drop = byKey.get(key);
          if (!drop) {
            drop = {
              source,
              translations: {},
            };
            byKey.set(key, drop);
          }
          drop.translations[locale] = value;
        }
      }
    }
  }
  return drops;
}

function findInFlightDrop(
  drops: InFlightDrops,
  fileId: string,
  key: string,
): InFlightDropLookup | undefined {
  const direct = drops.get(fileId)?.get(key);
  if (direct) {
    return {
      fileId,
      translations: direct.translations,
    };
  }
  let best: InFlightDropLookup | undefined;
  for (const [otherFileId, byKey] of drops) {
    const drop = byKey.get(key);
    if (!drop) {
      continue;
    }
    if (!best || compareKeys(otherFileId, best.fileId) < 0) {
      best = {
        fileId: otherFileId,
        translations: drop.translations,
      };
    }
  }
  return best;
}

function mergeOrphans(
  droppedTranslations: Map<string, Map<string, Record<string, string>>>,
  now: () => string,
  orphans: OrphanCache,
  restoredOrphans: Map<string, Set<string>>,
): boolean {
  let hasChanged = false;
  for (const [fileId, keys] of restoredOrphans) {
    for (const key of keys) {
      if (removeOrphan(orphans, fileId, key)) {
        hasChanged = true;
      }
    }
  }
  const timestamp = now();
  for (const [fileId, byKey] of droppedTranslations) {
    for (const [key, translations] of byKey) {
      addOrphan(orphans, fileId, key, {
        deletedAt: timestamp,
        translations,
      });
      hasChanged = true;
    }
  }
  return hasChanged;
}

function toExtractedKeySet(
  extractedByFile: Record<string, ExtractedVariant[]>,
): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  for (const [fileId, variants] of Object.entries(extractedByFile)) {
    result[fileId] = new Set(
      variants.map((variant) => toMessageKey(variant.source, variant.context)),
    );
  }
  return result;
}

function toExtractedByFile(
  messages: ExtractedMessage[],
): Record<string, ExtractedVariant[]> {
  const byFile = new Map<string, Map<string, ExtractedVariant>>();
  for (const message of messages) {
    const key = toMessageKey(message.source, message.context);
    const variant: ExtractedVariant =
      message.context === undefined
        ? {
            source: message.source,
          }
        : {
            context: message.context,
            source: message.source,
          };
    for (const location of message.locations) {
      let variants = byFile.get(location.fileId);
      if (!variants) {
        variants = new Map();
        byFile.set(location.fileId, variants);
      }
      variants.set(key, variant);
    }
  }
  const result: Record<string, ExtractedVariant[]> = {};
  for (const [fileId, variants] of byFile) {
    result[fileId] = [
      ...variants.values(),
    ].sort((a, b) =>
      compareKeys(
        toMessageKey(a.source, a.context),
        toMessageKey(b.source, b.context),
      ),
    );
  }
  return result;
}
