import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findProjectRoot, resolveProject } from './resolve';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOAD_TIMEOUT_MILLISECONDS = 30_000;

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'yapyak-vscode-project-'));
});

afterEach(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe('findProjectRoot', () => {
  it('returns the root when found', () => {
    writeFileSync(join(root, 'yapyak.config.ts'), '');
    mkdirSync(join(root, 'src', 'components'), {
      recursive: true,
    });

    expect(findProjectRoot(join(root, 'src', 'components'))).toBe(root);
  });

  it('returns undefined when not found', () => {
    expect(findProjectRoot(root)).toBeUndefined();
  });
});

describe('resolveProject', () => {
  it('returns the project holding its compiler and config', {
    timeout: LOAD_TIMEOUT_MILLISECONDS,
  }, async () => {
    writeFileSync(
      join(root, 'yapyak.config.mjs'),
      "export default { defaultLocale: 'sv' };\n",
    );
    mkdirSync(join(root, 'src'));
    const project = await resolveProject(join(root, 'src'));

    expect(project?.root).toBe(root);
    expect(project?.config.defaultLocale).toBe('sv');
    expect(typeof project?.compiler.extractFile).toBe('function');
  });

  it('returns the cached config within the TTL', async () => {
    writeFileSync(join(root, 'yapyak.config.mjs'), 'export default {};\n');
    const first = await resolveProject(root);
    const second = await resolveProject(root);

    expect(second?.config).toBe(first?.config);
  });

  it('returns undefined when no config file is found', async () => {
    expect(await resolveProject(root)).toBeUndefined();
  });

  it('returns undefined when the config file throws', async () => {
    writeFileSync(
      join(root, 'yapyak.config.mjs'),
      "throw new Error('Cancel');\n",
    );

    expect(await resolveProject(root)).toBeUndefined();
  });
});
