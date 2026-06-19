import type { SourceFile } from 'typescript';

import { readFileSync } from 'node:fs';
import ts from 'typescript';

const cache = new Map<string, SourceFile>();

export function parseSourceFile(filePath: string): SourceFile {
  const cached = cache.get(filePath);
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
  cache.set(filePath, sourceFile);
  return sourceFile;
}

export function resetSourceFileCache(): void {
  cache.clear();
}
