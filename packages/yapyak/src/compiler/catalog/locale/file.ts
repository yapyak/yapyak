import type { ExtractedMessage } from '../../parser';
import type { LocaleContext } from './context';
import type { OrphanCache } from './orphan';

import { YAP_COMPILE, warnDiagnostic } from '../../../diagnostic';
import { toMessageKey } from '../../../message-key';
import { writeEachAtomic } from './atomic';
import { stripBom } from './bom';
import { compareKeys, stringifyCanonical } from './canonical';
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

export type SyncItem = {
  fileId: string;
  locale: string;
  source: string;
};

export type SyncLocaleFilesResult = {
  orphaned: SyncItem[];
  restored: SyncItem[];
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
  entry?: CatalogEntry;
  errors: ParseEntryError[];
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

export function parseEntry(value: unknown): ParseEntryResult {
  if (typeof value === 'string') {
    return {
      entry: value,
      errors: [],
    };
  }
  if (!isPlainObject(value)) {
    return {
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
      errors,
    };
  }
  return {
    entry: variants,
    errors,
  };
}

export function writeLocaleFile(input: WriteLocaleFileInput): void {
  writeLocaleFiles([
    input,
  ]);
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
  const existingByLocale = readLocaleFiles(
    projectRoot,
    context.localesDir,
    nonDefaultLocales,
  );

  const inFlightDrops = extractInFlightDrops(
    existingByLocale,
    extractedKeys,
    input.filter,
    [
      ...existingByLocale.keys(),
    ],
  );
  const restoreContext: RestoreContext = {
    inFlightDrops,
    orphans,
    restored: [],
    restoredInFlight: new Map(),
    restoredOrphans: new Map(),
  };
  const nextByLocale = buildNextLocaleFiles(
    existingByLocale,
    extractedByFile,
    input.filter,
    restoreContext,
  );

  const { droppedTranslations, orphaned } = collectDrops(restoreContext);
  const hasOrphansChanged = mergeOrphans(
    droppedTranslations,
    options?.now ?? (() => new Date().toISOString()),
    orphans,
    restoreContext.restoredOrphans,
  );

  const writes = [
    ...nextByLocale,
  ].map(([locale, next]) => ({
    after: next,
    extractedKeys,
    filePath: getLocaleFilePath(projectRoot, context.localesDir, locale),
  }));
  writeLocaleFiles(writes);

  if (hasOrphansChanged) {
    writeOrphans(yapyakDir, orphans);
  }

  return {
    orphaned,
    restored: restoreContext.restored,
  };
}

export function toEntry(
  byContext: Map<string | undefined, string>,
  source: string,
  fileId: string,
): CatalogEntry {
  const plain = byContext.get(undefined);
  if (plain !== undefined && byContext.size === 1) {
    return plain;
  }
  if (plain !== undefined) {
    const { code, hint, message } = YAP_COMPILE.CONTEXT_MIXED_USAGE;
    throw new Error(
      `[yapyak] ${code}: ${message({
        fileId,
        source,
      })} ${hint()}`,
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
  writeEachAtomic(
    writes.map((write) => ({
      content: stringifyCanonical(write.after),
      path: write.filePath,
    })),
  );
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

type ExtractedVariant = {
  context?: string;
  source: string;
};

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

function readLocaleFiles(
  projectRoot: string,
  localesDir: string,
  locales: string[],
): Map<string, LocaleFile> {
  const filesByLocale = new Map<string, LocaleFile>();
  for (const locale of locales) {
    const localePath = getLocaleFilePath(projectRoot, localesDir, locale);
    try {
      filesByLocale.set(locale, readLocaleFile(localePath));
    } catch (error) {
      if (error instanceof CorruptLocaleFileError) {
        warnDiagnostic('CATALOG_LOCALE_FILE_CORRUPT', {
          detail: error.message,
        });
        continue;
      }
      throw error;
    }
  }
  return filesByLocale;
}

function getLocaleFilePath(
  projectRoot: string,
  localesDir: string,
  locale: string,
): string {
  return join(projectRoot, localesDir, `${locale}.json`);
}

type InFlightDrop = {
  source: string;
  translations: Record<string, string>;
};

type InFlightDrops = Map<string, Map<string, InFlightDrop>>;

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

type RestoreContext = {
  inFlightDrops: InFlightDrops;
  orphans: OrphanCache;
  restored: SyncItem[];
  restoredInFlight: Map<string, Set<string>>;
  restoredOrphans: Map<string, Set<string>>;
};

function buildNextLocaleFiles(
  existingByLocale: Map<string, LocaleFile>,
  extractedByFile: Record<string, ExtractedVariant[]>,
  filter: (fileId: string) => boolean,
  context: RestoreContext,
): Map<string, LocaleFile> {
  const nextByLocale = new Map<string, LocaleFile>();
  for (const [locale, existing] of existingByLocale) {
    const next: LocaleFile = {};
    for (const [fileId, entries] of Object.entries(existing)) {
      if (filter(fileId)) {
        continue;
      }
      next[fileId] = entries;
    }
    for (const fileId of Object.keys(extractedByFile).sort(compareKeys)) {
      const variants = extractedByFile[fileId];
      if (!variants) {
        continue;
      }
      next[fileId] = buildFileEntries(
        {
          existing,
          fileId,
          locale,
          variants,
        },
        context,
      );
    }
    nextByLocale.set(locale, next);
  }
  return nextByLocale;
}

type BuildFileEntriesInput = {
  existing: LocaleFile;
  fileId: string;
  locale: string;
  variants: ExtractedVariant[];
};

function buildFileEntries(
  input: BuildFileEntriesInput,
  context: RestoreContext,
): Record<string, CatalogEntry> {
  const existingFile = input.existing[input.fileId];
  const byContextBySource = new Map<string, Map<string | undefined, string>>();
  for (const { context: variantContext, source } of input.variants) {
    const key = toMessageKey(source, variantContext);
    let value = findTranslation(existingFile?.[source], variantContext) ?? '';
    if (value === '') {
      const orphan = findOrphan(context.orphans, input.fileId, key);
      const orphanValue = orphan?.entry.translations[input.locale];
      if (orphan && orphanValue) {
        value = orphanValue;
        registerPair(context.restoredOrphans, orphan.fileId, key);
        if (context.inFlightDrops.get(orphan.fileId)?.has(key)) {
          registerPair(context.restoredInFlight, orphan.fileId, key);
        }
        context.restored.push({
          fileId: input.fileId,
          locale: input.locale,
          source,
        });
      } else {
        const inFlight = findInFlightDrop(
          context.inFlightDrops,
          input.fileId,
          key,
        );
        const inFlightValue = inFlight?.translations[input.locale];
        if (inFlight && inFlightValue) {
          value = inFlightValue;
          registerPair(context.restoredInFlight, inFlight.fileId, key);
          context.restored.push({
            fileId: input.fileId,
            locale: input.locale,
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
    fileEntries[source] = toEntry(byContext, source, input.fileId);
  }
  return fileEntries;
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

type InFlightDropLookup = {
  fileId: string;
  translations: Record<string, string>;
};

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

type CollectDropsResult = {
  droppedTranslations: Map<string, Map<string, Record<string, string>>>;
  orphaned: SyncItem[];
};

function collectDrops(context: RestoreContext): CollectDropsResult {
  const droppedTranslations = new Map<
    string,
    Map<string, Record<string, string>>
  >();
  const orphaned: SyncItem[] = [];
  for (const [fileId, byKey] of context.inFlightDrops) {
    for (const [key, drop] of byKey) {
      if (context.restoredInFlight.get(fileId)?.has(key)) {
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
  return {
    droppedTranslations,
    orphaned,
  };
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
