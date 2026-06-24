import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retranslate } from './retranslate';
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
      'src/**/*.tsx',
    ],
    localesDir: 'locales',
    processors: [],
    translator: undefined,
    ...overrides,
  };
}

describe('retranslate', () => {
  let root: string;
  let writes: string[];
  let errorWrites: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-retranslate-'));
    writes = [];
    errorWrites = [];
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

  it('writes a fresh translation for the matching source', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: 'Old',
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => 'Spara'),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Save',
    );
    expect(code).toBe(0);
    const written = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(written['src/a.ts'].Save).toBe('Spara');
  });

  it('writes only the requested locale when `locale` is set', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: 'Old-sv',
        },
      }),
    );
    writeFileSync(
      join(root, 'locales', 'fr.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: 'Old-fr',
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => 'Spara'),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Save',
      {
        locale: 'sv',
      },
    );
    expect(code).toBe(0);
    const sv = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    const fr = JSON.parse(
      readFileSync(join(root, 'locales', 'fr.json'), 'utf-8'),
    );
    expect(sv['src/a.ts'].Save).toBe('Spara');
    expect(fr['src/a.ts'].Save).toBe('Old-fr');
  });

  it('writes only the matching disambiguation when `as` is set', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const a = t.as('badge', 'Save');\nexport const b = t.as('action', 'Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: {
            action: 'Old-action',
            badge: 'Old-badge',
          },
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => 'Spara'),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Save',
      {
        as: 'badge',
      },
    );
    expect(code).toBe(0);
    const sv = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(sv['src/a.ts'].Save.badge).toBe('Spara');
    expect(sv['src/a.ts'].Save.action).toBe('Old-action');
  });

  it('writes only the matching call site when `file` is set', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'src', 'b.ts'),
      `import { t } from 'yapyak';\nexport const y = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: 'Old-a',
        },
        'src/b.ts': {
          Save: 'Old-b',
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => 'Spara'),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Save',
      {
        file: 'src/a.ts',
      },
    );
    expect(code).toBe(0);
    const sv = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(sv['src/a.ts'].Save).toBe('Spara');
    expect(sv['src/b.ts'].Save).toBe('Old-b');
  });

  it('blocks the translator when no call site matches the source', async () => {
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
    const translatorFn = vi.fn(async () => '');
    const translator = Object.assign(translatorFn, {
      id: 'fake',
    });
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Hello',
    );
    expect(code).toBe(0);
    expect(writes.join('')).toContain('No matching call sites');
    expect(translatorFn).not.toHaveBeenCalled();
  });

  it('returns `1` when the source is empty', async () => {
    const translator = Object.assign(
      vi.fn(async () => ''),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      '',
    );
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Missing source string');
  });

  it('returns `1` when the locale code is invalid', async () => {
    const translator = Object.assign(
      vi.fn(async () => ''),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Save',
      {
        locale: 'not-a-locale-???',
      },
    );
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('Invalid locale code');
  });

  it('returns `1` when no translator is configured', async () => {
    const code = await retranslate(makeConfig(), root, 'Save');
    expect(code).toBe(1);
    expect(errorWrites.join('')).toContain('No translator configured');
  });

  it('returns `1` when the translator throws', async () => {
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
    const translator = Object.assign(
      vi.fn(async () => {
        throw new Error('boom');
      }),
      {
        id: 'fake',
      },
    );
    const code = await retranslate(
      makeConfig({
        translator,
      }),
      root,
      'Save',
    );
    expect(code).toBe(1);
  });
});
