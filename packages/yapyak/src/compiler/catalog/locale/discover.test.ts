import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { discoverLocales } from './discover';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('discoverLocales', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-discover-'));
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  it('returns only the default locale when the locales directory does not exist', () => {
    const result = discoverLocales('locales', root);
    expect(result).toEqual({
      defaultLocale: 'en',
      locales: [
        'en',
      ],
      warnings: [],
    });
  });

  it('lists locales discovered from `.json` files in the directory', () => {
    mkdirSync(join(root, 'locales'));
    writeFileSync(join(root, 'locales', 'en.json'), '{}');
    writeFileSync(join(root, 'locales', 'sv.json'), '{}');
    writeFileSync(join(root, 'locales', 'readme.md'), '');
    const result = discoverLocales('locales', root);
    expect(result.locales).toEqual([
      'en',
      'sv',
    ]);
  });

  it('folds the explicit `defaultLocale` into the locales list', () => {
    mkdirSync(join(root, 'locales'));
    writeFileSync(join(root, 'locales', 'sv.json'), '{}');
    const result = discoverLocales('locales', root, {
      defaultLocale: 'no',
    });
    expect(result.defaultLocale).toBe('no');
    expect(result.locales).toEqual([
      'no',
      'sv',
    ]);
  });

  it('emits a warning for a locale whose structure is invalid', () => {
    mkdirSync(join(root, 'locales'));
    writeFileSync(join(root, 'locales', 'EN_US.json'), '{}');
    const result = discoverLocales('locales', root);
    const warning = result.warnings.find((warning) => warning.code === 'EN_US');
    expect(warning?.issue).toBe('invalid-structure');
  });

  it('emits a warning with a suggestion for an unknown language code', () => {
    mkdirSync(join(root, 'locales'));
    writeFileSync(join(root, 'locales', 'xx.json'), '{}');
    const result = discoverLocales('locales', root);
    const warning = result.warnings.find((warning) => warning.code === 'xx');
    expect(warning?.issue).toBe('unknown-language');
  });

  it('lists no locale for a file whose name is not a valid code', () => {
    mkdirSync(join(root, 'locales'));
    writeFileSync(join(root, 'locales', 'sv.json'), '{}');
    writeFileSync(join(root, 'locales', 'EN_US.json'), '{}');
    writeFileSync(join(root, 'locales', 'xx.json'), '{}');
    const result = discoverLocales('locales', root);

    expect(result.locales).toEqual([
      'en',
      'sv',
    ]);
  });

  it('lists no locale for a directory whose name ends with `.json`', () => {
    mkdirSync(join(root, 'locales'));
    mkdirSync(join(root, 'locales', 'sv.json'));
    writeFileSync(join(root, 'locales', 'en.json'), '{}');
    const result = discoverLocales('locales', root);
    expect(result.locales).toEqual([
      'en',
    ]);
  });
});
