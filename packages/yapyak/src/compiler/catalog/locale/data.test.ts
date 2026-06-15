import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../../../warn';
import { readLocaleData } from './data';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('readLocaleData', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-data-'));
    mkdirSync(join(root, 'locales'), {
      recursive: true,
    });
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  it('returns parsed locale files for each requested locale', () => {
    writeFileSync(
      join(root, 'locales', 'sv.json'),
      JSON.stringify({
        'src/a.ts': {
          Hello: 'Hej',
        },
      }),
    );
    const result = readLocaleData(
      {
        locales: [
          'sv',
        ],
        localesDir: 'locales',
      },
      root,
    );
    expect(result.sv).toEqual({
      'src/a.ts': {
        Hello: 'Hej',
      },
    });
  });

  it('returns an empty entry when a locale file is missing', () => {
    const result = readLocaleData(
      {
        locales: [
          'sv',
        ],
        localesDir: 'locales',
      },
      root,
    );
    expect(result.sv).toEqual({});
  });

  it('warns and yields an empty entry when a locale file is corrupt', () => {
    writeFileSync(join(root, 'locales', 'sv.json'), '{not valid');
    const warnSpy = vi.fn();
    setWarn(warnSpy);
    try {
      const result = readLocaleData(
        {
          locales: [
            'sv',
          ],
          localesDir: 'locales',
        },
        root,
      );
      expect(result.sv).toEqual({});
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse locale file'),
        expect.objectContaining({
          code: 'YPK_CORRUPT_LOCALE_FILE',
        }),
      );
    } finally {
      resetWarn();
    }
  });

  it('throws when reading a locale file fails for a non-corrupt reason', () => {
    writeFileSync(join(root, 'locales', 'sv.json'), '{}');
    const path = join(root, 'locales', 'sv.json');
    rmSync(path);
    mkdirSync(path);
    expect(() =>
      readLocaleData(
        {
          locales: [
            'sv',
          ],
          localesDir: 'locales',
        },
        root,
      ),
    ).toThrow();
  });
});
