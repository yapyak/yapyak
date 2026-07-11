import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  add,
  check,
  clean,
  exportCommand,
  retranslate,
  status,
  translate,
} from './command';
import { run } from './run';

vi.mock('./command', () => ({
  add: vi.fn(async () => 0),
  check: vi.fn(() => 0),
  clean: vi.fn(() => 0),
  exportCommand: vi.fn(() => 0),
  retranslate: vi.fn(async () => 0),
  status: vi.fn(() => 0),
  translate: vi.fn(async () => 0),
}));

vi.mock('./config', () => ({
  loadConfig: vi.fn(async () => ({
    defaultLocale: 'en',
    examples: 0,
    exclude: [],
    include: [
      'src/**/*.ts',
    ],
    localesDir: 'locales',
    processors: [],
    translator: undefined,
  })),
}));

describe('run', () => {
  let writes: string[];
  let errorWrites: string[];

  beforeEach(() => {
    writes = [];
    errorWrites = [];
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
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns `0` and prints help when no command is given', async () => {
    const code = await run([]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('yapyak');
    expect(writes.join('')).toContain('Commands');
  });

  it('returns `0` and prints help when `--help` is given', async () => {
    const code = await run([
      '--help',
    ]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('Commands');
  });

  it('returns `0` and prints the version when `--version` is given', async () => {
    const code = await run([
      '--version',
    ]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('yapyak ');
  });

  it('returns `1` and warns about an unknown command on stderr', async () => {
    const code = await run([
      'bogus',
    ]);
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Unknown command: bogus');
  });

  it('picks the `status` command', async () => {
    await run([
      'status',
    ]);
    expect(status).toHaveBeenCalledTimes(1);
  });

  it('picks the `check` command', async () => {
    await run([
      'check',
    ]);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('picks the `clean` command', async () => {
    await run([
      'clean',
    ]);
    expect(clean).toHaveBeenCalledTimes(1);
  });

  it('picks the `add` command', async () => {
    await run([
      'add',
    ]);
    expect(add).toHaveBeenCalledTimes(1);
  });

  it('picks the `translate` command', async () => {
    await run([
      'translate',
    ]);
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('picks the `retranslate` command', async () => {
    await run([
      'retranslate',
      'Save',
    ]);
    expect(retranslate).toHaveBeenCalledTimes(1);
  });

  it('extracts the source as a positional arg into the `retranslate` command', async () => {
    await run([
      'retranslate',
      'Save',
    ]);
    expect(retranslate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'Save',
      expect.any(Object),
    );
  });

  it('extracts `--locale` into the `retranslate` options', async () => {
    await run([
      'retranslate',
      'Save',
      '--locale',
      'sv',
    ]);
    expect(retranslate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'Save',
      expect.objectContaining({
        locale: 'sv',
      }),
    );
  });

  it('extracts `--as` into the `retranslate` options', async () => {
    await run([
      'retranslate',
      'Save',
      '--as=badge',
    ]);
    expect(retranslate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'Save',
      expect.objectContaining({
        as: 'badge',
      }),
    );
  });

  it('extracts `--file` into the `retranslate` options', async () => {
    await run([
      'retranslate',
      'Save',
      '--file',
      'src/a.tsx',
    ]);
    expect(retranslate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'Save',
      expect.objectContaining({
        file: 'src/a.tsx',
      }),
    );
  });

  it('blocks the `--locale` value from parsing as the `retranslate` source', async () => {
    await run([
      'retranslate',
      '--locale',
      'sv',
      'Save',
    ]);
    expect(retranslate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'Save',
      expect.objectContaining({
        locale: 'sv',
      }),
    );
  });

  it('refuses `--locale` without a value on the `retranslate` command', async () => {
    const code = await run([
      'retranslate',
      'Save',
      '--locale',
    ]);
    expect(code).toBe(1);
    expect(retranslate).not.toHaveBeenCalled();
    expect(errorWrites.join('')).toContain('Missing value for flag');
    expect(errorWrites.join('')).toContain('--locale');
  });

  it('refuses a value flag followed by another flag on the `retranslate` command', async () => {
    const code = await run([
      'retranslate',
      'Save',
      '--file',
      '--locale',
      'sv',
    ]);
    expect(code).toBe(1);
    expect(retranslate).not.toHaveBeenCalled();
    expect(errorWrites.join('')).toContain('Missing value for flag');
    expect(errorWrites.join('')).toContain('--file');
  });

  it('picks the `export` command', async () => {
    await run([
      'export',
    ]);
    expect(exportCommand).toHaveBeenCalledTimes(1);
  });

  it('extracts `--json` into the `status` options', async () => {
    await run([
      'status',
      '--json',
    ]);
    expect(status).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        json: true,
      }),
    );
  });

  it('extracts `--write` into the `clean` options', async () => {
    await run([
      'clean',
      '--write',
    ]);
    expect(clean).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        write: true,
      }),
    );
  });

  it('extracts non-flag args into the `add` locales', async () => {
    await run([
      'add',
      'sv',
      'fr',
    ]);
    expect(add).toHaveBeenCalledWith(expect.anything(), expect.any(String), [
      'sv',
      'fr',
    ]);
  });

  it('extracts `--force` into the `translate` options', async () => {
    await run([
      'translate',
      '--force',
    ]);
    expect(translate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        force: true,
      }),
    );
  });

  it('extracts `--write=false` as `write: false` in the `clean` options', async () => {
    await run([
      'clean',
      '--write=false',
    ]);
    expect(clean).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        write: false,
      }),
    );
  });

  it('extracts `--write=0` as `write: false` in the `clean` options', async () => {
    await run([
      'clean',
      '--write=0',
    ]);
    expect(clean).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        write: false,
      }),
    );
  });

  it('extracts `--write=true` as `write: true` in the `clean` options', async () => {
    await run([
      'clean',
      '--write=true',
    ]);
    expect(clean).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        write: true,
      }),
    );
  });

  it('extracts `--force=false` as `force: false` in the `translate` options', async () => {
    await run([
      'translate',
      '--force=false',
    ]);
    expect(translate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        force: false,
      }),
    );
  });

  it('extracts the locale arg into the `translate` options', async () => {
    await run([
      'translate',
      'sv',
    ]);
    expect(translate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        locale: 'sv',
      }),
    );
  });

  it('extracts `--out=path` into the `export` options', async () => {
    await run([
      'export',
      '--out=snapshot.json',
    ]);
    expect(exportCommand).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        out: 'snapshot.json',
      }),
    );
  });

  it('extracts `--out path` (space form) into the `export` options', async () => {
    await run([
      'export',
      '--out',
      'snapshot.json',
    ]);
    expect(exportCommand).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        locales: [],
        out: 'snapshot.json',
      }),
    );
  });

  it('blocks the `--out` value from parsing as a locale', async () => {
    await run([
      'export',
      '--out',
      'snapshot.json',
      'sv',
    ]);
    expect(exportCommand).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        locales: [
          'sv',
        ],
        out: 'snapshot.json',
      }),
    );
  });

  it('extracts `--split` into the `export` options', async () => {
    await run([
      'export',
      '--split',
      '--out=out-dir',
    ]);
    expect(exportCommand).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        split: true,
      }),
    );
  });

  it('refuses an unknown flag on the `add` command', async () => {
    const code = await run([
      'add',
      '--frce',
      'sv',
    ]);
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Unknown flag');
    expect(errorWrites.join('')).toContain('--frce');
  });

  it('refuses an unknown flag on the `translate` command', async () => {
    const code = await run([
      'translate',
      '--frce',
    ]);
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Unknown flag');
  });

  it('refuses an unknown flag on the `export` command', async () => {
    const code = await run([
      'export',
      '--output=foo',
    ]);
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Unknown flag');
    expect(errorWrites.join('')).toContain('--output');
  });
});
