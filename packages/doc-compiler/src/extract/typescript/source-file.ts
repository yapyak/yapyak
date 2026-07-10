import type { SourceFile } from '@typescript/typescript6';

import ts from '@typescript/typescript6';

import { readFileSync } from 'node:fs';

const sourceFileCache = new Map<string, SourceFile>();

export function parseSourceFile(filePath: string): SourceFile {
  const cached = sourceFileCache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  const text = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  sourceFileCache.set(filePath, sourceFile);
  return sourceFile;
}

export function resetSourceFileCache(): void {
  sourceFileCache.clear();
}
