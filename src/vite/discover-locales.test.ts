import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discoverLocales } from './discover-locales.js';

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-discover-'));
  const fs = require('node:fs') as typeof import('node:fs');
  fs.mkdirSync(join(projectRoot, 'locales'), { recursive: true });
});

afterEach(() => {
  rmSync(projectRoot, { force: true, recursive: true });
});

function writeLocale(name: string): void {
  writeFileSync(join(projectRoot, 'locales', `${name}.yml`), '');
}

describe('discoverLocales', () => {
  it('lists all .yml files alphabetically', () => {
    writeLocale('sv');
    writeLocale('en');
    writeLocale('fr');
    const result = discoverLocales({ localesDir: 'locales', projectRoot });
    expect(result.locales).toEqual(['en', 'fr', 'sv']);
  });

  it('uses en as default when present', () => {
    writeLocale('sv');
    writeLocale('en');
    const result = discoverLocales({ localesDir: 'locales', projectRoot });
    expect(result.defaultLocale).toBe('en');
  });

  it('falls back to first alphabetical when no en', () => {
    writeLocale('sv');
    writeLocale('de');
    const result = discoverLocales({ localesDir: 'locales', projectRoot });
    expect(result.defaultLocale).toBe('de');
  });

  it('respects user-provided defaultLocale', () => {
    writeLocale('en');
    writeLocale('sv');
    const result = discoverLocales({
      defaultLocale: 'sv',
      localesDir: 'locales',
      projectRoot,
    });
    expect(result.defaultLocale).toBe('sv');
  });

  it('throws when defaultLocale has no matching file', () => {
    writeLocale('en');
    expect(() =>
      discoverLocales({
        defaultLocale: 'de',
        localesDir: 'locales',
        projectRoot,
      }),
    ).toThrow(/no matching/);
  });

  it('throws when locales directory missing', () => {
    rmSync(join(projectRoot, 'locales'), { force: true, recursive: true });
    expect(() =>
      discoverLocales({ localesDir: 'locales', projectRoot }),
    ).toThrow(/not found/);
  });

  it('throws when locales directory is empty', () => {
    expect(() =>
      discoverLocales({ localesDir: 'locales', projectRoot }),
    ).toThrow(/no locale files/);
  });

  it('ignores non-yml files', () => {
    writeLocale('en');
    writeFileSync(join(projectRoot, 'locales', 'sv.json'), '{}');
    writeFileSync(join(projectRoot, 'locales', 'README.md'), '');
    const result = discoverLocales({ localesDir: 'locales', projectRoot });
    expect(result.locales).toEqual(['en']);
  });
});
