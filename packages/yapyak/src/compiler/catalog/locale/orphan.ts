import { stringifyCanonical } from '../canonical';
import { writeAtomic } from './atomic';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

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
  const content = readFileSync(path, 'utf-8');
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
    return {};
  }
  const result: OrphanCache = {};
  for (const [fileId, sources] of Object.entries(parsed)) {
    if (typeof sources !== 'object' || sources === null) {
      continue;
    }
    const sourceMap: Record<string, OrphanEntry> = {};
    for (const [source, entry] of Object.entries(sources)) {
      const normalized = normalizeEntry(entry);
      if (normalized) {
        sourceMap[source] = normalized;
      }
    }
    if (Object.keys(sourceMap).length > 0) {
      result[fileId] = sourceMap;
    }
  }
  return result;
}

export function writeOrphans(yapyakDir: string, cache: OrphanCache): void {
  const path = getOrphansFilePath(yapyakDir);
  mkdirSync(dirname(path), {
    recursive: true,
  });
  writeAtomic(path, stringifyCanonical(cache));
}

export function findOrphan(
  cache: OrphanCache,
  fileId: string,
  source: string,
): OrphanLookup | undefined {
  const direct = cache[fileId]?.[source];
  if (direct) {
    return {
      entry: direct,
      fileId,
    };
  }
  let best: OrphanLookup | undefined;
  for (const [otherFileId, sources] of Object.entries(cache)) {
    const entry = sources[source];
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
  source: string,
): boolean {
  const sources = cache[fileId];
  if (!sources || !(source in sources)) {
    return false;
  }
  delete sources[source];
  if (Object.keys(sources).length === 0) {
    delete cache[fileId];
  }
  return true;
}

export function addOrphan(
  cache: OrphanCache,
  fileId: string,
  source: string,
  entry: OrphanEntry,
): void {
  let sources = cache[fileId];
  if (!sources) {
    sources = {};
    cache[fileId] = sources;
  }
  sources[source] = entry;
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
