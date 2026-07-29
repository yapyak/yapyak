import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildManifest } from './manifest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'manifest-'));
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
});

function writePackage(name: string): string {
  const root = join(dir, name);
  mkdirSync(join(root, 'src'), {
    recursive: true,
  });
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name,
    }),
  );
  writeFileSync(
    join(root, 'src', 'index.ts'),
    'export function createTranslator(): string { return "Hello"; }',
  );
  return root;
}

function writeGuide(): string {
  const root = join(dir, 'guide');
  mkdirSync(root, {
    recursive: true,
  });
  writeFileSync(join(root, 'hello.md'), '---\ntitle: Hello\n---\nWorld');
  return root;
}

describe('buildManifest', () => {
  it('builds a manifest with version `1`', async () => {
    const config: Config = {
      collections: {},
    };

    const manifest = await buildManifest(config);

    expect(manifest.version).toBe(1);
  });

  it('builds a `markdown` collection from a folder of markdown files', async () => {
    const root = writeGuide();
    const config: Config = {
      collections: {
        guide: {
          root,
          source: 'markdown',
        },
      },
    };

    const manifest = await buildManifest(config);

    expect(manifest.collections.guide?.pages.hello?.title).toBe('Hello');
  });

  it('populates page breadcrumbs from the sidebar', async () => {
    const root = join(dir, 'guide');
    mkdirSync(join(root, 'settings'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'settings', 'index.md'),
      '---\ntitle: Settings\n---\nGroup',
    );
    writeFileSync(
      join(root, 'settings', 'save.md'),
      '---\ntitle: Save\n---\nBody',
    );
    const config: Config = {
      collections: {
        guide: {
          root,
          source: 'markdown',
        },
      },
    };

    const manifest = await buildManifest(config);

    expect(
      manifest.collections.guide?.pages['settings/save']?.breadcrumbs,
    ).toEqual([
      'Settings',
    ]);
  });

  it('builds a `typescript` collection from a workspace package', async () => {
    const root = writePackage('yapyak');
    const config: Config = {
      collections: {
        reference: {
          packages: [
            {
              name: 'yapyak',
              root,
            },
          ],
          source: 'typescript',
        },
      },
    };

    const manifest = await buildManifest(config);

    expect(
      manifest.collections.reference?.pages['yapyak/createTranslator'],
    ).toBeDefined();
  });

  it('lists every export under `manifest.symbols`', async () => {
    const root = writePackage('yapyak');
    const config: Config = {
      collections: {
        reference: {
          packages: [
            {
              name: 'yapyak',
              root,
            },
          ],
          source: 'typescript',
        },
      },
    };

    const manifest = await buildManifest(config);

    expect(manifest.symbols['yapyak/createTranslator']).toEqual({
      collection: 'reference',
      path: 'yapyak/createTranslator',
    });
  });

  it('returns an empty `options` registry when none is configured', async () => {
    const config: Config = {
      collections: {},
    };

    const manifest = await buildManifest(config);

    expect(manifest.options).toEqual({});
  });

  it('returns the configured `options` registry when provided', async () => {
    const config: Config = {
      collections: {},
      options: {
        framework: {
          default: 'react',
          label: 'Settings',
          options: [
            {
              label: 'react',
              value: 'react',
            },
          ],
        },
      },
    };

    const manifest = await buildManifest(config);

    expect(manifest.options.framework?.default).toBe('react');
  });
});
