import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { translate } from './translate';
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

describe('translate', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-translate-'));
    writes = [];
    mkdirSync(join(root, 'src'), { recursive: true });
    mkdirSync(join(root, 'locales'), { recursive: true });
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it('returns `1` when no translator is configured', async () => {
    const code = await translate({
      config: makeConfig(),
      projectRoot: root,
    });
    expect(code).toBe(1);
    expect(writes.join('')).toContain('No translator configured');
  });

  it('returns `0` when no stubs are missing', async () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({ 'src/app.ts': { Save: 'Spara' } }),
    );
    const translatorFn = vi.fn(async () => '');
    const translator = Object.assign(translatorFn, { id: 'fake' });
    const code = await translate({
      config: makeConfig({ translator }),
      projectRoot: root,
    });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('Nothing to translate');
    expect(translatorFn).not.toHaveBeenCalled();
  });
});
