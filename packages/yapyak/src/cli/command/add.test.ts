import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { add } from './add';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    defaultLocale: 'en',
    examples: 0,
    exclude: [],
    include: ['src/**/*.ts'],
    localesDir: 'locales',
    processors: [],
    translator: undefined,
    ...overrides,
  };
}

describe('add', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-add-'));
    writes = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('returns `1` when no locales are given', async () => {
    const code = await add({
      config: makeConfig(),
      locales: [],
      projectRoot: root,
    });
    expect(code).toBe(1);
    expect(writes.join('')).toContain('Locale code required');
  });

  it('returns `1` when a locale code is invalid', async () => {
    const code = await add({
      config: makeConfig(),
      locales: ['EN_US'],
      projectRoot: root,
    });
    expect(code).toBe(1);
    expect(writes.join('')).toContain('Invalid locale code');
  });

  it('writes the locale file and returns `0` when no source strings exist', async () => {
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'app.ts'), '');
    const code = await add({
      config: makeConfig(),
      locales: ['sv'],
      projectRoot: root,
    });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('locales/sv.json');
  });
});
