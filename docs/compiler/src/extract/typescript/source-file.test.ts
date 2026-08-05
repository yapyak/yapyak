import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseSourceFile, resetSourceFileCache } from './source-file';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'source-file-'));
  resetSourceFileCache();
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
  resetSourceFileCache();
});

describe('parseSourceFile', () => {
  it('parses a file into a SourceFile carrying its content', () => {
    const path = join(dir, 'a.ts');
    writeFileSync(path, 'export const greeting = "Hello";');
    const sourceFile = parseSourceFile(path);
    expect(sourceFile.fileName.split('\\').join('/')).toBe(
      path.split('\\').join('/'),
    );
    expect(sourceFile.text).toBe('export const greeting = "Hello";');
  });

  it('returns the same instance for repeated reads of the same path', () => {
    const path = join(dir, 'a.ts');
    writeFileSync(path, 'export const greeting = "World";');
    const first = parseSourceFile(path);
    const second = parseSourceFile(path);
    expect(second).toBe(first);
  });
});

describe('resetSourceFileCache', () => {
  it('re-parses a file after the cache is reset', () => {
    const path = join(dir, 'a.ts');
    writeFileSync(path, 'export const greeting = "Save";');
    const first = parseSourceFile(path);
    resetSourceFileCache();
    const second = parseSourceFile(path);
    expect(second).not.toBe(first);
  });
});
