import { writeAtomic } from './atomic';
import { stripBom } from './bom';
import { stringifyCanonical } from './canonical';
import { isUnsafeKey } from './unsafe-key';
import { ensureYapyakDir } from './yapyak-dir';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type OrphanEntry = {
  deletedAt: string;
  translations: Record<string, string>;
};

export type OrphanCache = Record<string, Record<string, OrphanEntry>>;

type OrphanLookup = {
  entry: OrphanEntry;
  fileId: string;
};

export function getDefaultYapyakDir(projectRoot: string): string {
  return join(projectRoot, '.yapyak');
}

function getOrphansFilePath(yapyakDir: string): string {
  return join(yapyakDir, 'orphans.json');
}

export class CorruptOrphanCacheError extends Error {
  filePath: string;

  constructor(filePath: string, cause: unknown) {
    super(
      `[yapyak] Failed to parse orphan cache ${filePath}. Fix the JSON syntax to proceed.`,
      {
        cause,
      },
    );
    this.name = 'CorruptOrphanCacheError';
    this.filePath = filePath;
  }
}

export function readOrphans(yapyakDir: string): OrphanCache {
  const path = getOrphansFilePath(yapyakDir);
  if (!existsSync(path)) {
    return {};
  }
  const content = stripBom(readFileSync(path, 'utf-8'));
  if (content.trim() === '') {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    throw new CorruptOrphanCacheError(path, cause);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return Object.create(null);
  }
  const result: OrphanCache = Object.create(null);
  for (const [fileId, entries] of Object.entries(parsed)) {
    if (isUnsafeKey(fileId)) {
      continue;
    }
    if (typeof entries !== 'object' || entries === null) {
      continue;
    }
    const byKey: Record<string, OrphanEntry> = Object.create(null);
    for (const [key, entry] of Object.entries(entries)) {
      if (isUnsafeKey(key)) {
        continue;
      }
      const normalized = normalizeEntry(entry);
      if (normalized) {
        byKey[key] = normalized;
      }
    }
    if (Object.keys(byKey).length > 0) {
      result[fileId] = byKey;
    }
  }
  return result;
}

export function writeOrphans(yapyakDir: string, cache: OrphanCache): void {
  ensureYapyakDir(yapyakDir);
  writeAtomic(getOrphansFilePath(yapyakDir), stringifyCanonical(cache));
}

export function findOrphan(
  cache: OrphanCache,
  fileId: string,
  key: string,
): OrphanLookup | undefined {
  const direct = cache[fileId]?.[key];
  if (direct) {
    return {
      entry: direct,
      fileId,
    };
  }
  let best: OrphanLookup | undefined;
  for (const [otherFileId, entries] of Object.entries(cache)) {
    const entry = entries[key];
    if (!entry) {
      continue;
    }
    if (
      !best ||
      entry.deletedAt > best.entry.deletedAt ||
      (entry.deletedAt === best.entry.deletedAt && otherFileId < best.fileId)
    ) {
      best = {
        entry,
        fileId: otherFileId,
      };
    }
  }
  return best;
}

export function removeOrphan(
  cache: OrphanCache,
  fileId: string,
  key: string,
): boolean {
  const entries = cache[fileId];
  if (!entries || !Object.hasOwn(entries, key)) {
    return false;
  }
  delete entries[key];
  if (Object.keys(entries).length === 0) {
    delete cache[fileId];
  }
  return true;
}

export function addOrphan(
  cache: OrphanCache,
  fileId: string,
  key: string,
  entry: OrphanEntry,
): void {
  const entries: Record<string, OrphanEntry> =
    cache[fileId] ?? Object.create(null);
  entries[key] = entry;
  cache[fileId] = entries;
}

function normalizeEntry(value: unknown): OrphanEntry | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const deletedAt = record.deletedAt;
  const translations = record.translations;
  if (typeof deletedAt !== 'string') {
    return undefined;
  }
  if (typeof translations !== 'object' || translations === null) {
    return undefined;
  }
  const cleanTranslations: Record<string, string> = {};
  for (const [locale, translation] of Object.entries(
    translations as Record<string, unknown>,
  )) {
    if (typeof translation === 'string' && translation) {
      cleanTranslations[locale] = translation;
    }
  }
  if (Object.keys(cleanTranslations).length === 0) {
    return undefined;
  }
  return {
    deletedAt,
    translations: cleanTranslations,
  };
}
