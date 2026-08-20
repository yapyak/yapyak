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

  it('blocks an absolute output path inside the locales directory', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      out: join(root, 'locales'),
      split: false,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('refuses to write');
  });

  it('blocks a nested output path inside the locales directory', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      out: 'locales/nested.json',
      split: false,
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

  it('builds context variants in the snapshot for `t.as` sources', () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const a = t.as('button', 'Open');\nexport const b = t.as('badge', 'Open');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      }),
    );
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      split: false,
    });
    expect(code).toBe(0);
    expect(JSON.parse(writes.join(''))).toEqual({
      en: {
        'src/a.ts': {
          Open: {
            badge: 'Open',
            button: 'Open',
          },
        },
      },
      sv: {
        'src/a.ts': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      },
    });
  });

  it('builds an empty string for a source without a translation', () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\nexport const y = t('Cancel');\n`,
    );
    const code = exportCommand(makeConfig(), root, {
      locales: [
        'sv',
      ],
      split: false,
    });
    expect(code).toBe(0);
    expect(JSON.parse(writes.join(''))).toEqual({
      sv: {
        'src/a.ts': {
          Cancel: '',
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

  it('writes one file for each locale when `--split` receives no locale filter', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      out: 'out-dir',
      split: true,
    });
    expect(code).toBe(0);
    expect(existsSync(join(root, 'out-dir', 'en.json'))).toBe(true);
    expect(existsSync(join(root, 'out-dir', 'sv.json'))).toBe(true);
    expect(writes.join('')).toContain('2 locales');
  });

  it('writes the split files when the output directory already exists', () => {
    mkdirSync(join(root, 'out-dir'));
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

  it('reports a singular locale count for a single-locale snapshot file', () => {
    const code = exportCommand(makeConfig(), root, {
      locales: [
        'sv',
      ],
      out: 'snapshot.json',
      split: false,
    });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('(1 locale)');
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

  it('reports a plural error count when multiple locale entries are invalid', () => {
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        '../escape/Bar.tsx': {
          Save: 'Spara',
        },
        '../escape/Baz.tsx': {
          Save: 'Spara',
        },
      }),
    );
    const code = exportCommand(makeConfig(), root, {
      locales: [],
      split: false,
    });
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('2 errors in locale files');
  });
});
