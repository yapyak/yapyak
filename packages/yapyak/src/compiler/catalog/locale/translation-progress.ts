import { writeAtomic } from './atomic';
import { stripBom } from './bom';
import { stringifyCanonical } from './canonical';
import { isPlainObject } from './plain-object';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type TranslationProgress = {
  errors: {
    fileId: string;
    locale: string;
    message: string;
    source: string;
  }[];
  finishedAt: string | null;
  id: string;
  locales: string[];
  pid: number;
  startedAt: string;
  total: number;
  translated: number;
};

export function readTranslationProgress(
  yapyakDir: string,
): TranslationProgress | undefined {
  const path = getProgressFilePath(yapyakDir);
  if (!existsSync(path)) {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripBom(readFileSync(path, 'utf-8')));
  } catch {
    return undefined;
  }
  return isTranslationProgress(parsed) ? parsed : undefined;
}

export function writeTranslationProgress(
  yapyakDir: string,
  progress: TranslationProgress,
): void {
  mkdirSync(yapyakDir, {
    recursive: true,
  });
  writeAtomic(getProgressFilePath(yapyakDir), stringifyCanonical(progress));
}

export function isTranslationRunning(progress: TranslationProgress): boolean {
  return progress.finishedAt === null && isProcessAlive(progress.pid);
}

function getProgressFilePath(yapyakDir: string): string {
  return join(yapyakDir, 'progress.json');
}

function isTranslationProgress(value: unknown): value is TranslationProgress {
  if (!isPlainObject(value)) {
    return false;
  }
  return (
    Array.isArray(value.errors) &&
    value.errors.every(isProgressError) &&
    (value.finishedAt === null || typeof value.finishedAt === 'string') &&
    typeof value.id === 'string' &&
    Array.isArray(value.locales) &&
    value.locales.every((locale) => typeof locale === 'string') &&
    isNonNegativeInteger(value.pid) &&
    value.pid > 0 &&
    typeof value.startedAt === 'string' &&
    isNonNegativeInteger(value.total) &&
    isNonNegativeInteger(value.translated)
  );
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ESRCH') {
        return false;
      }
      if (error.code === 'EPERM') {
        return true;
      }
    }
    throw error;
  }
}

function isProgressError(value: unknown): boolean {
  return (
    isPlainObject(value) &&
    typeof value.fileId === 'string' &&
    typeof value.locale === 'string' &&
    typeof value.message === 'string' &&
    typeof value.source === 'string'
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
