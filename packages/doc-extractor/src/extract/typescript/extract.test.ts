import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractPackage } from './extract';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'extract-'));
  mkdirSync(join(dir, 'src'));
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
});

function writeFiles(files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, '..'), {
      recursive: true,
    });
    writeFileSync(full, content);
  }
}

describe('extractPackage', () => {
  it('returns a manifest with the package name and a root module', () => {
    writeFiles({
      'src/index.ts': 'export function greet(): string { return "Hello"; }',
    });
    const manifest = extractPackage({
      context: {
        collectionName: 'reference',
        packageName: 'demo',
        packageSlug: 'demo',
      },
      packageDir: dir,
    });
    expect(manifest.packageName).toBe('demo');
    expect(manifest.modules).toHaveLength(1);
    expect(manifest.modules[0]?.id).toBe('demo');
  });

  it('extracts every requested subpath as an additional module', () => {
    writeFiles({
      'src/index.ts': 'export function greet(): string { return "Hello"; }',
      'src/processor.ts': 'export function process(): string { return "Save"; }',
    });
    const manifest = extractPackage({
      context: {
        collectionName: 'reference',
        packageName: 'demo',
        packageSlug: 'demo',
      },
      packageDir: dir,
      subpaths: [
        './processor',
      ],
    });
    expect(manifest.modules.map((module) => module.id)).toEqual([
      'demo',
      'demo/processor',
    ]);
  });
});
