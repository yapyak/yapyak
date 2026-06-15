import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { exportCommand } from './export';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    defaultLocale: 'en',
    examples: 0,
    exclude: [],
    include: [
      'src/**/*.ts',
    ],
    localesDir: 'locales',
    processors: [],
    translator: undefined,
    ...overrides,
  };
}

describe('exportCommand', () => {
  let root: string;
  let writes: string[];
  let errorWrites: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-export-'));
    writes = [];
    errorWrites = [];
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    mkdirSync(join(root, 'locales'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: 'Spara',
        },
      }),
    );
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      errorWrites.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
    vi.restoreAllMocks();
  });

  it('returns `1` when `--split` is given without `--out`', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      split: true,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('--split requires --out');
  });

  it('refuses to write inside the locales directory', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      out: 'locales',
      split: true,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('refuses to write');
  });

  it('emits a JSON snapshot to stdout when no `--out` is given', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      split: false,
    });
    expect(code).toBe(0);
    const stdout = writes.join('');
    expect(stdout).toContain('"sv"');
    expect(stdout).toContain('"Spara"');
  });

  it('writes a single snapshot file when `--out` is given', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      out: 'snapshot.json',
      split: false,
    });
    expect(code).toBe(0);
    const written = readFileSync(join(root, 'snapshot.json'), 'utf-8');
    expect(JSON.parse(written)).toMatchObject({
      sv: {
        'src/a.ts': {
          Save: 'Spara',
        },
      },
    });
  });

  it('returns `1` when the locale filter includes an unknown locale', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [
        'de',
      ],
      split: false,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Unknown locale');
  });

  it('returns `1` when the locale filter includes multiple unknown locales', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [
        'de',
        'fr',
      ],
      split: false,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Unknown locales');
  });

  it('writes one file per locale when `--split` and `--out` are given', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [
        'sv',
      ],
      out: 'out-dir',
      split: true,
    });
    expect(code).toBe(0);
    expect(existsSync(join(root, 'out-dir', 'sv.json'))).toBe(true);
  });

  it('blocks the export when a locale file has an unsafe path key', () => {
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        '../escape/Bar.tsx': {
          Save: 'Spara',
        },
      }),
    );
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      split: false,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('error');
    expect(errorWrites.join('')).toContain('Refusing to export');
  });
});
