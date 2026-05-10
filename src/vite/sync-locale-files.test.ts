import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { syncLocaleFiles } from './sync-locale-files.js';

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-sync-'));
});

afterEach(() => {
  rmSync(projectRoot, { force: true, recursive: true });
});

function writeLocale(name: string, content: string): void {
  const dir = join(projectRoot, 'locales');
  writeFileSync(
    join(dir, `${name}.yml`),
    content,
    { flag: 'w' },
  );
}

function readLocale(name: string): unknown {
  const path = join(projectRoot, 'locales', `${name}.yml`);
  return parse(readFileSync(path, 'utf-8'));
}

describe('syncLocaleFiles', () => {
  it('writes default locale file from extracted schemas', () => {
    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/welcome.tsx',
          schema: {
            cta: 'Open inbox',
            greeting: 'Hello {name}',
          },
          variableName: 't',
        },
      ],
    });
    expect(readLocale('en')).toEqual({
      'src/welcome.tsx': {
        cta: 'Open inbox',
        greeting: 'Hello {name}',
      },
    });
  });

  it('creates empty stubs in non-default locales', () => {
    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/welcome.tsx',
          schema: { cta: 'Open inbox' },
          variableName: 't',
        },
      ],
    });
    expect(readLocale('sv')).toEqual({
      'src/welcome.tsx': {
        cta: '',
      },
    });
  });

  it('preserves existing translations in non-default locales', () => {
    require('node:fs').mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    writeLocale(
      'sv',
      'src/welcome.tsx:\n  cta: Öppna inkorgen\n',
    );
    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/welcome.tsx',
          schema: { cta: 'Open inbox' },
          variableName: 't',
        },
      ],
    });
    expect(readLocale('sv')).toEqual({
      'src/welcome.tsx': {
        cta: 'Öppna inkorgen',
      },
    });
  });

  it('counts added stubs per locale', () => {
    const result = syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv', 'fr'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/welcome.tsx',
          schema: { cta: 'Open inbox', greeting: 'Hello' },
          variableName: 't',
        },
      ],
    });
    expect(result.added).toEqual({ en: 0, sv: 2, fr: 2 });
  });

  it('reports orphans for keys removed from schema', () => {
    require('node:fs').mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    writeLocale(
      'sv',
      'src/welcome.tsx:\n  cta: Öppna\n  removed: Gammal text\n',
    );
    const result = syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/welcome.tsx',
          schema: { cta: 'Open inbox' },
          variableName: 't',
        },
      ],
    });
    expect(result.orphans).toEqual([
      { fileId: 'src/welcome.tsx', key: 'removed', locale: 'sv' },
    ]);
  });

  it('reports orphans for entire files removed from source', () => {
    require('node:fs').mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    writeLocale(
      'sv',
      'src/old.tsx:\n  cta: Borta\nsrc/welcome.tsx:\n  cta: Öppna\n',
    );
    const result = syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/welcome.tsx',
          schema: { cta: 'Open inbox' },
          variableName: 't',
        },
      ],
    });
    expect(result.orphans).toContainEqual({
      fileId: 'src/old.tsx',
      key: 'cta',
      locale: 'sv',
    });
  });

  it('handles nested schemas', () => {
    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/forms.tsx',
          schema: {
            buttons: { cancel: 'Cancel', save: 'Save' },
          },
          variableName: 't',
        },
      ],
    });
    expect(readLocale('sv')).toEqual({
      'src/forms.tsx': {
        buttons: { cancel: '', save: '' },
      },
    });
  });

  it('merges multiple defineTranslations calls in same file', () => {
    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/app.tsx',
          schema: { hello: 'Hello' },
          variableName: 'a',
        },
        {
          fileId: 'src/app.tsx',
          schema: { bye: 'Bye' },
          variableName: 'b',
        },
      ],
    });
    expect(readLocale('en')).toEqual({
      'src/app.tsx': { bye: 'Bye', hello: 'Hello' },
    });
  });

  it('writes files in deterministic key order', () => {
    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/z.tsx',
          schema: { z_key: 'Z' },
          variableName: 't',
        },
        {
          fileId: 'src/a.tsx',
          schema: { a_key: 'A' },
          variableName: 't',
        },
      ],
    });
    const content = readFileSync(
      join(projectRoot, 'locales', 'en.yml'),
      'utf-8',
    );
    expect(content.indexOf('src/a.tsx')).toBeLessThan(
      content.indexOf('src/z.tsx'),
    );
  });

  it('returns the list of files written', () => {
    const result = syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      schemas: [
        {
          fileId: 'src/test.tsx',
          schema: { cta: 'Test' },
          variableName: 't',
        },
      ],
    });
    expect(result.filesWritten).toHaveLength(2);
    expect(result.filesWritten[0]).toContain('en.yml');
    expect(result.filesWritten[1]).toContain('sv.yml');
  });
});
