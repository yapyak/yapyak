import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { status } from './status';
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

describe('status', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-status-'));
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

  it('returns `0` when every translation is present', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({ 'src/app.ts': { Save: 'Spara' } }),
    );
    const code = status({ config: makeConfig(), projectRoot: root });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('All translations present');
  });

  it('returns `1` and lists every missing entry when translations are missing', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({ 'src/app.ts': { Save: '' } }),
    );
    const code = status({ config: makeConfig(), projectRoot: root });
    expect(code).toBe(1);
    expect(writes.join('')).toContain('missing in');
  });

  it('writes every missing entry grouped under its locale', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const a = t('Save');\nexport const b = t('Cancel');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({ 'src/app.ts': { Cancel: '', Save: '' } }),
    );
    const code = status({ config: makeConfig(), projectRoot: root });
    expect(code).toBe(1);
    const output = writes.join('');
    expect(output).toContain('Save');
    expect(output).toContain('Cancel');
  });

  it('writes a truncation hint when missing entries exceed the limit', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      [
        "import { t } from 'yapyak';",
        "export const a = t('Hello');",
        "export const b = t('World');",
        "export const c = t('Save');",
        "export const d = t('Save changes');",
        "export const e = t('Cancel');",
        "export const f = t('Settings');",
        "export const g = t('Loading...');",
        "export const h = t('Switch account');",
        "export const i = t('Unnamed account');",
        "export const j = t.as('button', 'Save');",
        "export const k = t.as('toolbar', 'Save');",
      ].join('\n'),
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/app.ts': {
          Cancel: '',
          Hello: '',
          Loading: '',
          'Loading...': '',
          Save: '',
          'Save changes': '',
          'Save@button': '',
          'Save@toolbar': '',
          Settings: '',
          'Switch account': '',
          'Unnamed account': '',
          World: '',
        },
      }),
    );
    const code = status({ config: makeConfig(), projectRoot: root });
    expect(code).toBe(1);
    expect(writes.join('')).toContain('more');
  });

  it('emits a JSON payload when `json` is `true`', () => {
    writeFileSync(
      join(root, 'src', 'app.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({ 'src/app.ts': { Save: 'Spara' } }),
    );
    const code = status({
      config: makeConfig(),
      json: true,
      projectRoot: root,
    });
    expect(code).toBe(0);
    const parsed = JSON.parse(writes.join('').trim());
    expect(parsed.totalMessages).toBeGreaterThanOrEqual(1);
  });
});
