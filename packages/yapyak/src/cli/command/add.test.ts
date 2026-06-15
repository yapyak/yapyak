import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { add } from './add';
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

describe('add', () => {
  let root: string;
  let writes: string[];
  let errorWrites: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-add-'));
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
    rmSync(root, {
      force: true,
      recursive: true,
    });
    vi.restoreAllMocks();
  });

  it('returns `1` when no locales are given', async () => {
    const code = await add(makeConfig(), root, []);
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Locale code required');
  });

  it('returns `1` when a locale code is invalid', async () => {
    const code = await add(makeConfig(), root, [
      'EN_US',
    ]);
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Invalid locale code');
  });

  it('writes the locale file and returns `0` when no source strings exist', async () => {
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    writeFileSync(join(root, 'src', 'a.ts'), '');
    const code = await add(makeConfig(), root, [
      'sv',
    ]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('locales/sv.json');
  });

  it('returns `0` when every translation is present already', async () => {
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
    const code = await add(makeConfig(), root, [
      'sv',
    ]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('All translations present already');
  });

  it('returns `0` when no translator is configured but strings need translation', async () => {
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    const code = await add(makeConfig(), root, [
      'sv',
    ]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('strings need translation');
  });

  it('writes every translation when the translator fills missing strings', async () => {
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    const translator = Object.assign(
      vi.fn(async () => 'Spara'),
      {
        id: 'fake',
      },
    );
    const code = await add(
      makeConfig({
        translator,
      }),
      root,
      [
        'sv',
      ],
    );
    expect(code).toBe(0);
    const written = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(written['src/a.ts'].Save).toBe('Spara');
  });

  it('returns `1` when the translator throws', async () => {
    mkdirSync(join(root, 'src'), {
      recursive: true,
    });
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    const translator = Object.assign(
      vi.fn(async () => {
        throw new Error('boom');
      }),
      {
        id: 'fake',
      },
    );
    const code = await add(
      makeConfig({
        translator,
      }),
      root,
      [
        'sv',
      ],
    );
    expect(code).toBe(1);
  });
});
