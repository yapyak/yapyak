import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { walkSourceFiles } from './source-file';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('walkSourceFiles', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-walk-'));
  });

  afterEach(() => {
    try {
      chmodSync(projectRoot, 0o755);
    } catch {}
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  it('lists files with `fileId` relative to `projectRoot`', () => {
    mkdirSync(join(projectRoot, 'src'), {
      recursive: true,
    });
    writeFileSync(join(projectRoot, 'src', 'a.tsx'), '');
    writeFileSync(join(projectRoot, 'src', 'b.ts'), '');

    const files = walkSourceFiles(() => true, projectRoot);

    expect(files.map((file) => file.fileId).sort()).toEqual([
      'src/a.tsx',
      'src/b.ts',
    ]);
  });

  it('normalizes ids to relative paths before calling the filter', () => {
    mkdirSync(join(projectRoot, 'src'), {
      recursive: true,
    });
    writeFileSync(join(projectRoot, 'src', 'a.tsx'), '');

    const seen: string[] = [];
    walkSourceFiles((id) => {
      seen.push(id);
      return true;
    }, projectRoot);

    for (const id of seen) {
      expect(id.startsWith('/')).toBe(false);
    }
  });

  it('blocks directories when filter rejects the probe id', () => {
    mkdirSync(join(projectRoot, 'src'), {
      recursive: true,
    });
    mkdirSync(join(projectRoot, 'node_modules', 'foo'), {
      recursive: true,
    });
    writeFileSync(join(projectRoot, 'src', 'a.tsx'), '');
    writeFileSync(join(projectRoot, 'node_modules', 'foo', 'index.ts'), '');

    const filter = (id: string): boolean => !id.startsWith('node_modules/');
    const files = walkSourceFiles(filter, projectRoot);

    expect(files.map((file) => file.fileId)).toEqual([
      'src/a.tsx',
    ]);
  });

  it('blocks a file when the filter rejects its `fileId`', () => {
    mkdirSync(join(projectRoot, 'src'), {
      recursive: true,
    });
    writeFileSync(join(projectRoot, 'src', 'a.ts'), 'Hello');
    writeFileSync(join(projectRoot, 'src', 'b.ts'), 'World');

    const files = walkSourceFiles(
      (fileId) => fileId !== 'src/b.ts',
      projectRoot,
    );

    expect(files.map((file) => file.fileId)).toEqual([
      'src/a.ts',
    ]);
  });

  it('returns no files when the project root does not exist', () => {
    const files = walkSourceFiles(() => true, join(projectRoot, 'missing'));
    expect(files).toEqual([]);
  });

  it('returns no files for a broken symlink entry', () => {
    mkdirSync(join(projectRoot, 'src'), {
      recursive: true,
    });
    symlinkSync(
      join(projectRoot, 'missing.ts'),
      join(projectRoot, 'src', 'a.ts'),
    );

    const files = walkSourceFiles(() => true, projectRoot);

    expect(files).toEqual([]);
  });

  it('blocks a filtered-out symlink from shadowing a filtered-in path to the same real dir', () => {
    const externalRoot = mkdtempSync(join(tmpdir(), 'yapyak-external-'));
    try {
      const realDir = join(externalRoot, 'real');
      mkdirSync(realDir, {
        recursive: true,
      });
      writeFileSync(join(realDir, 'a.ts'), 'Hello');
      mkdirSync(join(projectRoot, 'node_modules'), {
        recursive: true,
      });
      mkdirSync(join(projectRoot, 'src'), {
        recursive: true,
      });
      symlinkSync(realDir, join(projectRoot, 'node_modules', 'shadow'));
      symlinkSync(realDir, join(projectRoot, 'src', 'shadow'));

      const filter = (id: string): boolean => !id.startsWith('node_modules/');
      const files = walkSourceFiles(filter, projectRoot);

      expect(files.map((file) => file.fileId)).toEqual([
        'src/shadow/a.ts',
      ]);
    } finally {
      rmSync(externalRoot, {
        force: true,
        recursive: true,
      });
    }
  });

  it.skipIf(process.platform === 'win32')(
    'returns no files when a file is unreadable',
    () => {
      mkdirSync(join(projectRoot, 'src'), {
        recursive: true,
      });
      const filePath = join(projectRoot, 'src', 'a.ts');
      writeFileSync(filePath, 'Hello');
      chmodSync(filePath, 0o000);

      try {
        const files = walkSourceFiles(() => true, projectRoot);
        expect(files).toEqual([]);
      } finally {
        chmodSync(filePath, 0o644);
      }
    },
  );
});
