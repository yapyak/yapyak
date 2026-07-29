import type { LocaleContext } from './context';
import type { CatalogEntry } from './file';
import type { MigrateLocalesInput, MigrateLocalesOptions } from './migrate';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../../../warn';
import { toMessageKey } from '../../parser';
import { detectRenames, migrateLocales } from './migrate';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('detectRenames', () => {
  it('lists no renames when sources are unchanged', () => {
    const entries = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
    ];
    expect(detectRenames(entries, entries)).toEqual([]);
  });

  it('lists no renames when nothing was removed', () => {
    const old = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
    ];
    const next = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
      {
        column: 1,
        line: 2,
        source: 'Cancel',
      },
    ];
    expect(detectRenames(old, next)).toEqual([]);
  });

  it('lists no renames when nothing was added', () => {
    const old = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
      {
        column: 1,
        line: 2,
        source: 'Cancel',
      },
    ];
    const next = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
    ];
    expect(detectRenames(old, next)).toEqual([]);
  });

  it('lists a rename when a removed source and an added source share a position', () => {
    const old = [
      {
        column: 5,
        line: 1,
        source: 'Save',
      },
    ];
    const next = [
      {
        column: 5,
        line: 1,
        source: 'Save changes',
      },
    ];
    expect(detectRenames(old, next)).toEqual([
      {
        from: 'Save',
        to: 'Save changes',
      },
    ]);
  });

  it('lists no rename when removed and added positions differ', () => {
    const old = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
    ];
    const next = [
      {
        column: 5,
        line: 2,
        source: 'Save changes',
      },
    ];
    expect(detectRenames(old, next)).toEqual([]);
  });

  it('lists a rename when only one of two sources changes', () => {
    const old = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
      {
        column: 1,
        line: 2,
        source: 'Cancel',
      },
    ];
    const next = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
      {
        column: 1,
        line: 2,
        source: 'Loading...',
      },
    ];
    expect(detectRenames(old, next)).toEqual([
      {
        from: 'Cancel',
        to: 'Loading...',
      },
    ]);
  });

  it('drops the second rename when the added source is already claimed', () => {
    const old = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
      {
        column: 1,
        line: 2,
        source: 'Cancel',
      },
    ];
    const next = [
      {
        column: 1,
        line: 1,
        source: 'Save changes',
      },
      {
        column: 1,
        line: 2,
        source: 'Save changes',
      },
    ];
    expect(detectRenames(old, next)).toEqual([
      {
        from: 'Save',
        to: 'Save changes',
      },
    ]);
  });

  it('lists every rename pair when each position matches', () => {
    const old = [
      {
        column: 1,
        line: 1,
        source: 'Save',
      },
      {
        column: 1,
        line: 2,
        source: 'Cancel',
      },
    ];
    const next = [
      {
        column: 1,
        line: 1,
        source: 'Save changes',
      },
      {
        column: 1,
        line: 2,
        source: 'Loading...',
      },
    ];
    expect(detectRenames(old, next)).toEqual([
      {
        from: 'Save',
        to: 'Save changes',
      },
      {
        from: 'Cancel',
        to: 'Loading...',
      },
    ]);
  });
});

describe('migrateLocales', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-migrate-'));
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

  function writeLocale(
    locale: string,
    content: Record<string, Record<string, CatalogEntry>>,
  ): void {
    writeFileSync(
      join(root, 'locales', `${locale}.json`),
      JSON.stringify(content),
    );
  }

  function readLocale(
    locale: string,
  ): Record<string, Record<string, CatalogEntry>> {
    return JSON.parse(
      readFileSync(join(root, 'locales', `${locale}.json`), 'utf-8'),
    );
  }

  function runMigrate(
    overrides: {
      context?: Partial<LocaleContext>;
      input?: Partial<MigrateLocalesInput>;
      options?: Partial<MigrateLocalesOptions>;
    } = {},
  ): ReturnType<typeof migrateLocales> {
    return migrateLocales(
      {
        extractedKeys: {
          'src/a.ts': new Set([
            'Save changes',
          ]),
        },
        fileId: 'src/a.ts',
        renames: [
          {
            from: 'Save',
            to: 'Save changes',
          },
        ],
        ...overrides.input,
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
        ...overrides.context,
      },
      root,
      {
        preserveTranslations: true,
        ...overrides.options,
      },
    );
  }

  it('migrates no entries when renames is empty', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      input: {
        renames: [],
      },
    });
    expect(result.staleEntries).toEqual([]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        Save: 'Spara',
      },
    });
  });

  it('migrates no entries for the default locale', () => {
    writeLocale('en', {
      'src/a.ts': {
        Save: 'Save',
      },
    });
    writeLocale('sv', {});
    const result = runMigrate({
      context: {
        locales: [
          'en',
        ],
      },
    });
    expect(result.staleEntries).toEqual([]);
    expect(readLocale('en')).toEqual({
      'src/a.ts': {
        Save: 'Save',
      },
    });
  });

  it('migrates no entries when the locale file lacks the fileId', () => {
    writeLocale('sv', {
      'src/b.ts': {
        Save: 'Spara',
      },
    });
    const result = runMigrate();
    expect(result.staleEntries).toEqual([]);
    expect(readLocale('sv')).toEqual({
      'src/b.ts': {
        Save: 'Spara',
      },
    });
  });

  it('migrates no entries when the rename source key is absent', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Cancel: 'Avbryt',
      },
    });
    const result = runMigrate();
    expect(result.staleEntries).toEqual([]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        Cancel: 'Avbryt',
      },
    });
  });

  it('preserves the previous translation when `preserveTranslations` is true', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      options: {
        preserveTranslations: true,
      },
    });
    expect(result.staleEntries).toEqual([
      {
        locale: 'sv',
        source: 'Save changes',
      },
    ]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        'Save changes': 'Spara',
      },
    });
  });

  it('clears the translation when `preserveTranslations` is false', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      options: {
        preserveTranslations: false,
      },
    });
    expect(result.staleEntries).toEqual([
      {
        locale: 'sv',
        source: 'Save changes',
      },
    ]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        'Save changes': '',
      },
    });
  });

  it('clears the translation when `options` is omitted', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Save: 'Spara',
      },
    });
    const result = migrateLocales(
      {
        extractedKeys: {
          'src/a.ts': new Set([
            'Save changes',
          ]),
        },
        fileId: 'src/a.ts',
        renames: [
          {
            from: 'Save',
            to: 'Save changes',
          },
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir: 'locales',
      },
      root,
    );
    expect(result.staleEntries).toEqual([
      {
        locale: 'sv',
        source: 'Save changes',
      },
    ]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        'Save changes': '',
      },
    });
  });

  it('lists every migration in `staleEntries`', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      input: {
        extractedKeys: {
          'src/a.ts': new Set([
            'Save changes',
            'Loading...',
          ]),
        },
        renames: [
          {
            from: 'Save',
            to: 'Save changes',
          },
          {
            from: 'Cancel',
            to: 'Loading...',
          },
        ],
      },
    });
    expect(result.staleEntries).toEqual([
      {
        locale: 'sv',
        source: 'Save changes',
      },
      {
        locale: 'sv',
        source: 'Loading...',
      },
    ]);
  });

  it('reports a conflict when the rename target already has a translation', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Save: 'Spara',
        'Save changes': 'Spara ändringar',
      },
    });
    const result = runMigrate();
    expect(result.conflicts).toEqual([
      {
        fileId: 'src/a.ts',
        from: 'Save',
        locale: 'sv',
        to: 'Save changes',
      },
    ]);
    expect(result.staleEntries).toEqual([]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        'Save changes': 'Spara ändringar',
      },
    });
  });

  it('reports no conflict when the rename target exists but is empty', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Save: 'Spara',
        'Save changes': '',
      },
    });
    const result = runMigrate();
    expect(result.conflicts).toEqual([]);
    expect(result.staleEntries).toEqual([
      {
        locale: 'sv',
        source: 'Save changes',
      },
    ]);
  });

  it('reports a conflict when the rename target has a non-empty context translation', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Open: {
          button: 'Öppna',
        },
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      input: {
        renames: [
          {
            from: 'Save',
            to: 'Open',
          },
        ],
      },
    });
    expect(result.conflicts).toEqual([
      {
        fileId: 'src/a.ts',
        from: 'Save',
        locale: 'sv',
        to: 'Open',
      },
    ]);
    expect(result.staleEntries).toEqual([]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        Open: {
          button: 'Öppna',
        },
      },
    });
  });

  it('reports no conflict when the rename target has only empty context translations', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Open: {
          button: '',
        },
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      input: {
        renames: [
          {
            from: 'Save',
            to: 'Open',
          },
        ],
      },
    });
    expect(result.conflicts).toEqual([]);
    expect(result.staleEntries).toEqual([
      {
        locale: 'sv',
        source: 'Open',
      },
    ]);
    expect(readLocale('sv')).toEqual({
      'src/a.ts': {
        Open: 'Spara',
      },
    });
  });

  it('throws when the locale file is a directory', () => {
    mkdirSync(join(root, 'locales', 'sv.json'));

    expect(() => runMigrate()).toThrow(/EISDIR/);
  });

  describe('catch-and-warn', () => {
    let warnSpy: ReturnType<
      typeof vi.fn<(message: string, meta?: Record<string, unknown>) => void>
    >;

    beforeEach(() => {
      warnSpy =
        vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
      setWarn(warnSpy);
    });

    afterEach(() => {
      resetWarn();
    });

    it('warns with YAP0039 when a locale file is corrupt', () => {
      writeFileSync(join(root, 'locales', 'sv.json'), '{ not valid json');
      runMigrate();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^YAP0039 /),
        expect.objectContaining({
          code: 'YAP0039',
        }),
      );
    });

    it('migrates no entries for a corrupt locale', () => {
      writeFileSync(join(root, 'locales', 'sv.json'), '{ not valid json');
      const result = runMigrate();
      expect(result.conflicts).toEqual([]);
      expect(result.staleEntries).toEqual([]);
    });

    it('migrates the healthy locale when another locale is corrupt', () => {
      writeFileSync(join(root, 'locales', 'sv.json'), '{ not valid json');
      writeLocale('fi', {
        'src/a.ts': {
          Save: 'Tallenna',
        },
      });
      const result = runMigrate({
        context: {
          locales: [
            'en',
            'sv',
            'fi',
          ],
        },
      });
      expect(result.staleEntries).toEqual([
        {
          locale: 'fi',
          source: 'Save changes',
        },
      ]);
    });

    it('warns with YAP0039 when the write would clear an in-use translation', () => {
      writeLocale('sv', {
        'src/a.ts': {
          Save: 'Spara',
        },
      });
      runMigrate({
        input: {
          extractedKeys: {
            'src/a.ts': new Set([
              toMessageKey('Save'),
            ]),
          },
        },
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^YAP0039 /),
        expect.objectContaining({
          code: 'YAP0039',
        }),
      );
    });

    it('writes no file when the invariant fails', () => {
      writeLocale('sv', {
        'src/a.ts': {
          Save: 'Spara',
        },
      });
      runMigrate({
        input: {
          extractedKeys: {
            'src/a.ts': new Set([
              toMessageKey('Save'),
            ]),
          },
        },
      });
      expect(readLocale('sv')).toEqual({
        'src/a.ts': {
          Save: 'Spara',
        },
      });
    });

    it('warns once per corrupt locale', () => {
      writeFileSync(join(root, 'locales', 'sv.json'), '{ not valid json');
      writeLocale('fi', {
        'src/a.ts': {
          Save: 'Tallenna',
        },
      });
      runMigrate({
        context: {
          locales: [
            'en',
            'sv',
            'fi',
          ],
        },
      });
      const corruptWarns = warnSpy.mock.calls.filter(
        ([, meta]) =>
          typeof meta === 'object' &&
          meta !== null &&
          'locale' in meta &&
          meta.locale === 'sv',
      );
      expect(corruptWarns).toHaveLength(1);
    });
  });
});
