import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clean } from './clean';
import {
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

describe('clean', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-clean-'));
    writes = [];
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    mkdirSync(join(root, 'locales'), {
      recursive: true,
    });
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
    vi.restoreAllMocks();
  });

  it('returns `0` with a check mark when no orphan entries exist', () => {
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
    const code = clean(makeConfig(), root, {
      write: false,
    });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('No orphan entries');
  });

  it('lists orphan entries without writing when `write` is `false`', () => {
    writeFileSync(join(root, 'src', 'a.ts'), '');
    const before = JSON.stringify({
      'src/a.ts': {
        Save: 'Spara',
      },
    });
    writeFileSync(join(root, 'locales', 'sv.json'), before);
    const code = clean(makeConfig(), root, {
      write: false,
    });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('orphan source');
    expect(readFileSync(join(root, 'locales', 'sv.json'), 'utf-8')).toBe(
      before,
    );
  });

  it('clears orphan entries from the locale files when `write` is `true`', () => {
    writeFileSync(join(root, 'src', 'a.ts'), '');
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: 'Spara',
        },
      }),
    );
    const code = clean(makeConfig(), root, {
      write: true,
    });
    expect(code).toBe(0);
    const after = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(after).toEqual({});
  });
});
