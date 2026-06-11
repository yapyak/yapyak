import type { Config } from '../config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { translate } from './translate';
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

describe('translate', () => {
  let root: string;
  let writes: string[];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-translate-'));
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

  it('returns `1` when no translator is configured', async () => {
    const code = await translate(makeConfig(), root);
    expect(code).toBe(1);
    expect(writes.join('')).toContain('No translator configured');
  });

  it('returns `0` when no stubs are missing', async () => {
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
    const code = await translate(
      makeConfig({
        translator,
      }),
      root,
    );
    expect(code).toBe(0);
    expect(writes.join('')).toContain('Nothing to translate');
    expect(translatorFn).not.toHaveBeenCalled();
  });

  it('returns `0` when every missing translation is filled', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: '',
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => 'Spara'),
      {
        id: 'fake',
      },
    );
    const code = await translate(
      makeConfig({
        translator,
      }),
      root,
    );
    expect(code).toBe(0);
    const written = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(written['src/a.ts'].Save).toBe('Spara');
  });

  it('writes every translation when `force` is set', async () => {
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
    const code = await translate(
      makeConfig({
        translator,
      }),
      root,
      {
        force: true,
      },
    );
    expect(code).toBe(0);
    const written = JSON.parse(
      readFileSync(join(root, 'locales', 'sv.json'), 'utf-8'),
    );
    expect(written['src/a.ts'].Save).toBe('Spara');
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
          Save: '',
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
    const code = await translate(
      makeConfig({
        translator,
      }),
      root,
    );
    expect(code).toBe(1);
  });

  it('returns `130` when SIGINT cancels mid-translate', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: '',
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => {
        process.emit('SIGINT');
        return 'Spara';
      }),
      {
        id: 'fake',
      },
    );
    const code = await translate(
      makeConfig({
        translator,
      }),
      root,
    );
    expect(code).toBe(130);
    expect(writes.join('')).toContain('cancelled');
    expect(writes.join('')).toContain('Partial results written');
  });

  it('blocks every remaining locale when SIGINT fires after the first', async () => {
    writeFileSync(
      join(root, 'src', 'a.ts'),
      `import { t } from 'yapyak';\nexport const x = t('Save');\n`,
    );
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: '',
        },
      }),
    );
    writeFileSync(
      join(root, 'locales', 'fr.json'),
      JSON.stringify({
        'src/a.ts': {
          Save: '',
        },
      }),
    );
    const translator = Object.assign(
      vi.fn(async () => {
        process.emit('SIGINT');
        return 'Spara';
      }),
      {
        id: 'fake',
      },
    );
    const code = await translate(
      makeConfig({
        translator,
      }),
      root,
    );
    expect(code).toBe(130);
    expect(translator).toHaveBeenCalledTimes(1);
  });
});
