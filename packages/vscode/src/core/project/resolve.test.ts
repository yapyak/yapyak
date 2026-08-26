import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  findProjectRoot,
  resolveProject,
  resolveThroughScope,
} from './resolve';
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

describe('resolveThroughScope', () => {
  function buildResolver(
    map: Record<string, Record<string, string>>,
  ): (base: string, id: string) => string {
    return (base, id) => {
      const resolved = map[base]?.[id];
      if (resolved === undefined) {
        throw new Error(`unresolved ${id} from ${base}`);
      }
      return resolved;
    };
  }

  it('returns the bare resolution when the project holds yapyak', () => {
    const anchor = join(root, 'package.json');
    const resolve = buildResolver({
      [anchor]: {
        'yapyak/compiler/internal': '/direct/compiler.js',
      },
    });

    expect(resolveThroughScope(root, 'yapyak/compiler/internal', resolve)).toBe(
      '/direct/compiler.js',
    );
  });

  it('resolves through a scoped dependency when the bare id fails', () => {
    const anchor = join(root, 'package.json');
    writeFileSync(
      anchor,
      JSON.stringify({
        dependencies: {
          '@yapyak/nuxt': '0.0.11',
        },
      }),
    );
    const resolve = buildResolver({
      [anchor]: {
        '@yapyak/nuxt': '/store/@yapyak/nuxt/dist/index.js',
      },
      '/store/@yapyak/nuxt/dist/index.js': {
        'yapyak/compiler/internal': '/store/yapyak/compiler.js',
      },
    });

    expect(resolveThroughScope(root, 'yapyak/compiler/internal', resolve)).toBe(
      '/store/yapyak/compiler.js',
    );
  });

  it('resolves through a scoped devDependency', () => {
    const anchor = join(root, 'package.json');
    writeFileSync(
      anchor,
      JSON.stringify({
        devDependencies: {
          '@yapyak/nuxt': '0.0.11',
        },
      }),
    );
    const resolve = buildResolver({
      [anchor]: {
        '@yapyak/nuxt': '/store/@yapyak/nuxt/dist/index.js',
      },
      '/store/@yapyak/nuxt/dist/index.js': {
        'yapyak/compiler/internal': '/store/yapyak/compiler.js',
      },
    });

    expect(resolveThroughScope(root, 'yapyak/compiler/internal', resolve)).toBe(
      '/store/yapyak/compiler.js',
    );
  });

  it('skips scoped dependencies that cannot reach the id', () => {
    const anchor = join(root, 'package.json');
    writeFileSync(
      anchor,
      JSON.stringify({
        dependencies: {
          '@yapyak/gemini': '0.0.11',
          '@yapyak/nuxt': '0.0.11',
        },
      }),
    );
    const resolve = buildResolver({
      [anchor]: {
        '@yapyak/gemini': '/store/@yapyak/gemini/dist/index.js',
        '@yapyak/nuxt': '/store/@yapyak/nuxt/dist/index.js',
      },
      '/store/@yapyak/nuxt/dist/index.js': {
        'yapyak/compiler/internal': '/store/yapyak/compiler.js',
      },
    });

    expect(resolveThroughScope(root, 'yapyak/compiler/internal', resolve)).toBe(
      '/store/yapyak/compiler.js',
    );
  });

  it('skips dependencies outside the yapyak scope', () => {
    const anchor = join(root, 'package.json');
    writeFileSync(
      anchor,
      JSON.stringify({
        dependencies: {
          vue: '3.5.40',
        },
      }),
    );
    const calls: string[] = [];
    const resolve = (base: string, id: string): string => {
      calls.push(id);
      throw new Error(`unresolved ${id} from ${base}`);
    };

    expect(() =>
      resolveThroughScope(root, 'yapyak/compiler/internal', resolve),
    ).toThrow();
    expect(calls).toEqual([
      'yapyak/compiler/internal',
    ]);
  });

  it('throws when nothing resolves', () => {
    const resolve = buildResolver({});

    expect(() =>
      resolveThroughScope(root, 'yapyak/compiler/internal', resolve),
    ).toThrow('Install yapyak in the project');
  });
});
