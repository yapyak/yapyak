import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveImport } from './resolve-import';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'resolve-import-'));
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
});

describe('resolveImport', () => {
  it('resolves a sibling `.ts` file', () => {
    writeFileSync(join(dir, 'a.ts'), '');
    writeFileSync(join(dir, 'b.ts'), '');
    expect(resolveImport(join(dir, 'a.ts'), './b')).toBe(join(dir, 'b.ts'));
  });

  it('resolves a folder via `index.ts`', () => {
    writeFileSync(join(dir, 'a.ts'), '');
    mkdirSync(join(dir, 'sub'));
    writeFileSync(join(dir, 'sub', 'index.ts'), '');
    expect(resolveImport(join(dir, 'a.ts'), './sub')).toBe(
      join(dir, 'sub', 'index.ts'),
    );
  });

  it('returns undefined for a bare package specifier', () => {
    expect(resolveImport(join(dir, 'a.ts'), 'typescript')).toBeUndefined();
  });

  it('returns undefined when the target does not exist', () => {
    writeFileSync(join(dir, 'a.ts'), '');
    expect(resolveImport(join(dir, 'a.ts'), './missing')).toBeUndefined();
  });
});
