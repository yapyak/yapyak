import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { walkSourceFiles } from './source-file';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('walkSourceFiles', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-walk-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { force: true, recursive: true });
  });

  it('lists files with `fileId` relative to `projectRoot`', () => {
    mkdirSync(join(projectRoot, 'src'), { recursive: true });
    writeFileSync(join(projectRoot, 'src', 'a.tsx'), '');
    writeFileSync(join(projectRoot, 'src', 'b.ts'), '');

    const files = walkSourceFiles({ filter: () => true, projectRoot });

    expect(files.map((f) => f.fileId).sort()).toEqual([
      'src/a.tsx',
      'src/b.ts',
    ]);
  });

  it('passes relative ids to the filter', () => {
    mkdirSync(join(projectRoot, 'src'), { recursive: true });
    writeFileSync(join(projectRoot, 'src', 'a.tsx'), '');

    const seen: string[] = [];
    walkSourceFiles({
      filter: (id) => {
        seen.push(id);
        return true;
      },
      projectRoot,
    });

    for (const id of seen) {
      expect(id.startsWith('/')).toBe(false);
    }
  });

  it('blocks directories when filter rejects the probe id', () => {
    mkdirSync(join(projectRoot, 'src'), { recursive: true });
    mkdirSync(join(projectRoot, 'node_modules', 'foo'), { recursive: true });
    writeFileSync(join(projectRoot, 'src', 'a.tsx'), '');
    writeFileSync(join(projectRoot, 'node_modules', 'foo', 'index.ts'), '');

    const filter = (id: string): boolean => !id.startsWith('node_modules/');
    const files = walkSourceFiles({ filter, projectRoot });

    expect(files.map((f) => f.fileId)).toEqual(['src/a.tsx']);
  });
});
