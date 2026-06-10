import type { LocaleContext } from './context';
import type { MigrateLocalesInput, MigrateLocalesOptions } from './migrate';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
    content: Record<string, Record<string, string>>,
  ): void {
    writeFileSync(
      join(root, 'locales', `${locale}.json`),
      JSON.stringify(content),
    );
  }

  function readLocale(locale: string): Record<string, Record<string, string>> {
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
        extractedSources: {
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

  it('lists every migration in `staleEntries`', () => {
    writeLocale('sv', {
      'src/a.ts': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
    const result = runMigrate({
      input: {
        extractedSources: {
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
});
