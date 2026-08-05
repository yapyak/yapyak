import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { info } from './info';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('info', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-info-'));
    writes = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns `0` when the project has no `package.json`', () => {
    const code = info(root);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('yapyak');
  });

  it('reports the running yapyak version', () => {
    const packageFile = JSON.parse(
      readFileSync(
        join(import.meta.dirname, '..', '..', '..', 'package.json'),
        'utf-8',
      ),
    );

    info(root);

    expect(writes.join('')).toContain('yapyak');
    expect(writes.join('')).toContain(packageFile.version);
  });

  it('reports the Node version and platform', () => {
    info(root);
    const output = writes.join('');
    expect(output).toContain(process.version);
    expect(output).toContain(process.platform);
  });

  it('reports `unknown` when no package manager user agent is present', () => {
    vi.stubEnv('npm_config_user_agent', undefined);

    info(root);

    expect(writes.join('')).toContain('unknown');
  });

  it('lists declared `@yapyak/*`, `vite`, and `typescript` packages with installed versions', () => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@yapyak/react': '0.0.0',
        },
        devDependencies: {
          typescript: '6.0.3',
          vite: '8.1.5',
        },
      }),
    );
    mkdirSync(join(root, 'node_modules', '@yapyak', 'react'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'node_modules', '@yapyak', 'react', 'package.json'),
      JSON.stringify({
        name: '@yapyak/react',
        version: '0.0.0',
      }),
    );
    mkdirSync(join(root, 'node_modules', 'typescript'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'node_modules', 'typescript', 'package.json'),
      JSON.stringify({
        name: 'typescript',
        version: '6.0.3',
      }),
    );
    mkdirSync(join(root, 'node_modules', 'vite'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'node_modules', 'vite', 'package.json'),
      JSON.stringify({
        name: 'vite',
        version: '8.1.5',
      }),
    );

    info(root);

    const output = writes.join('');
    expect(output).toContain('@yapyak/react');
    expect(output).toContain('6.0.3');
    expect(output).toContain('8.1.5');
  });

  it('falls back to the declared range when a package is not installed', () => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@yapyak/vue': '0.0.0',
        },
      }),
    );

    info(root);

    expect(writes.join('')).toContain('(not installed)');
  });

  it('skips dependencies outside the yapyak scope', () => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          react: '19.1.0',
        },
      }),
    );

    info(root);

    expect(writes.join('')).not.toContain('19.1.0');
  });

  it('finds a hoisted `typescript` install without a declaration', () => {
    const appRoot = join(root, 'app');
    mkdirSync(appRoot, {
      recursive: true,
    });
    writeFileSync(join(appRoot, 'package.json'), JSON.stringify({}));
    mkdirSync(join(root, 'node_modules', 'typescript'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'node_modules', 'typescript', 'package.json'),
      JSON.stringify({
        name: 'typescript',
        version: '6.0.3',
      }),
    );

    info(appRoot);

    const output = writes.join('');
    expect(output).toContain('typescript');
    expect(output).toContain('6.0.3');
  });

  it('skips a declared `yapyak` dependency', () => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          yapyak: '0.0.0',
        },
      }),
    );

    info(root);

    expect(writes.join('').match(/yapyak/g)).toHaveLength(1);
  });
});
