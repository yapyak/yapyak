import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ensureYapyakDir } from './yapyak-dir';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'yapyak-dir-'));
});

afterEach(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('ensureYapyakDir', () => {
  it('writes a self-ignoring `.gitignore` in the created directory', () => {
    const yapyakDir = join(root, '.yapyak');

    ensureYapyakDir(yapyakDir);

    expect(readFileSync(join(yapyakDir, '.gitignore'), 'utf8')).toBe('*\n');
  });

  it('preserves an existing `.gitignore`', () => {
    const yapyakDir = join(root, '.yapyak');
    ensureYapyakDir(yapyakDir);
    writeFileSync(join(yapyakDir, '.gitignore'), 'orphans.json\n');

    ensureYapyakDir(yapyakDir);

    expect(readFileSync(join(yapyakDir, '.gitignore'), 'utf8')).toBe(
      'orphans.json\n',
    );
  });
});
