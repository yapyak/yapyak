import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { check } from './check';
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

describe('check', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-check-'));
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

  it('returns `0` when no messages exist and no diagnostics fire', () => {
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'app.ts'), '');
    const code = check({ config: makeConfig(), projectRoot: root });
    expect(code).toBe(0);
  });

  it('returns `1` when translations are missing', () => {
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    mkdirSync(join(root, 'locales'), { recursive: true });
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({ 'src/app.ts': { Save: '' } }),
    );
    const code = check({ config: makeConfig(), projectRoot: root });
    expect(code).toBe(1);
    expect(writes.join('')).toContain('missing translations');
  });
});
