import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractExports } from './export';
import { resetSourceFileCache } from './source-file';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'export-'));
  resetSourceFileCache();
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
  resetSourceFileCache();
});

describe('extractExports', () => {
  it('collects declarations carrying an export modifier', () => {
    const entry = join(dir, 'index.ts');
    writeFileSync(
      entry,
      'export function greet(): string { return "Hello"; }\nexport type Settings = { theme: string };',
    );
    const result = extractExports(entry);
    expect(
      [
        ...result.keys(),
      ].sort(),
    ).toEqual([
      'Settings',
      'greet',
    ]);
  });

  it('follows a named re-export into a sibling file', () => {
    writeFileSync(
      join(dir, 'leaf.ts'),
      'export function greet(): string { return "Save"; }',
    );
    const entry = join(dir, 'index.ts');
    writeFileSync(entry, `export { greet } from './leaf';`);
    expect([
      ...extractExports(entry).keys(),
    ]).toEqual([
      'greet',
    ]);
  });

  it('follows a transitive barrel chain through multiple files', () => {
    const sub = join(dir, 'translation');
    mkdirSync(sub);
    writeFileSync(
      join(sub, 'leaf.ts'),
      'export function translate(): string { return "World"; }',
    );
    writeFileSync(join(sub, 'index.ts'), `export { translate } from './leaf';`);
    const entry = join(dir, 'index.ts');
    writeFileSync(entry, `export { translate } from './translation';`);
    expect([
      ...extractExports(entry).keys(),
    ]).toEqual([
      'translate',
    ]);
  });

  it('forwards every export of a star re-export', () => {
    writeFileSync(
      join(dir, 'leaf.ts'),
      'export function a(): string { return "Cancel"; }\nexport function b(): string { return "Login"; }',
    );
    const entry = join(dir, 'index.ts');
    writeFileSync(entry, `export * from './leaf';`);
    expect(
      [
        ...extractExports(entry).keys(),
      ].sort(),
    ).toEqual([
      'a',
      'b',
    ]);
  });

  it('renames an export when the specifier uses an `as` clause', () => {
    writeFileSync(
      join(dir, 'leaf.ts'),
      'export function internalName(): string { return "Logout"; }',
    );
    const entry = join(dir, 'index.ts');
    writeFileSync(
      entry,
      `export { internalName as publicName } from './leaf';`,
    );
    expect([
      ...extractExports(entry).keys(),
    ]).toEqual([
      'publicName',
    ]);
  });

  it('skips a default export', () => {
    const entry = join(dir, 'index.ts');
    writeFileSync(
      entry,
      'const module = { setup(): void {} };\nexport type Settings = { theme: string };\nexport default module;',
    );
    const result = extractExports(entry);
    expect([
      ...result.keys(),
    ]).toEqual([
      'Settings',
    ]);
  });

  it('skips a re-exported default export', () => {
    writeFileSync(
      join(dir, 'leaf.ts'),
      'const module = { setup(): void {} };\nexport type Settings = { theme: string };\nexport default module;',
    );
    const entry = join(dir, 'index.ts');
    writeFileSync(
      entry,
      `export type { Settings } from './leaf';\nexport { default } from './leaf';`,
    );
    expect([
      ...extractExports(entry).keys(),
    ]).toEqual([
      'Settings',
    ]);
  });
});
