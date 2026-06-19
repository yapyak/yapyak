import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractModule } from './module';
import { resetSourceFileCache } from './source-file';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'module-'));
  mkdirSync(join(dir, 'src'));
  resetSourceFileCache();
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
  resetSourceFileCache();
});

function writeEntry(content: string): string {
  const entry = join(dir, 'src', 'index.ts');
  writeFileSync(entry, content);
  return entry;
}

describe('extractModule', () => {
  it('builds a module with id, subpath, and source path', () => {
    const entry = writeEntry('export function greet(): string { return "Hello"; }');
    const module = extractModule({
      entryFile: entry,
      moduleId: 'demo',
      packageDir: dir,
      subpath: '.',
    });
    expect(module.id).toBe('demo');
    expect(module.subpath).toBe('.');
    expect(module.sourcePath).toBe('src/index.ts');
  });

  it('reads the leading file-level JSDoc as the module description', () => {
    const entry = writeEntry(
      '/**\n * Demo module greeting.\n */\nexport function greet(): string { return "Hello"; }',
    );
    const module = extractModule({
      entryFile: entry,
      moduleId: 'demo',
      packageDir: dir,
      subpath: '.',
    });
    expect(module.description).toBe('Demo module greeting.');
  });

  it('sorts exports alphabetically by name', () => {
    const entry = writeEntry(
      'export function greet(): string { return "Hello"; }\nexport function cancel(): string { return "Cancel"; }',
    );
    const module = extractModule({
      entryFile: entry,
      moduleId: 'demo',
      packageDir: dir,
      subpath: '.',
    });
    expect(module.exports.map((symbol) => symbol.name)).toEqual([
      'cancel',
      'greet',
    ]);
  });
});
