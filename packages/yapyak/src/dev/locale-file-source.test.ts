import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { registerCatalog, resetDevStore } from '../dev-store';
import { runTrackers } from '../tracker';
import { registerLocaleFileSource } from './locale-file-source';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let localesDir = '';

beforeEach(() => {
  localesDir = mkdtempSync(join(tmpdir(), 'yapyak-locale-file-source-'));
});

afterEach(() => {
  rmSync(localesDir, {
    force: true,
    recursive: true,
  });
  resetDevStore();
});

function writeLocaleFile(
  locale: string,
  entries: Record<string, Record<string, string>>,
): string {
  const path = join(localesDir, `${locale}.json`);
  writeFileSync(path, `${JSON.stringify(entries)}\n`);
  return path;
}

describe('registerLocaleFileSource', () => {
  it('syncs the catalog with the locale file on the first tracker run', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const catalog = registerCatalog('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: path,
    });

    runTrackers();

    expect(catalog).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });

  it('syncs the catalog again when the locale file changes', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const catalog = registerCatalog('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: path,
    });
    runTrackers();

    writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hejsan',
      },
    });
    runTrackers();

    expect(catalog['sv']).toBe('Hejsan');
  });

  it('drops the catalog entry when the locale file empties the value', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const catalog = registerCatalog('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: path,
    });
    runTrackers();

    writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: '',
      },
    });
    runTrackers();

    expect(catalog).toEqual({
      en: 'Hello',
    });
  });

  it('preserves the catalog when the locale file turns corrupt', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const catalog = registerCatalog('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: path,
    });
    runTrackers();

    writeFileSync(path, '{ broken');
    runTrackers();

    expect(catalog['sv']).toBe('Hej');
  });

  it('skips a locale file that does not exist', () => {
    const catalog = registerCatalog('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: join(localesDir, 'missing.json'),
    });

    runTrackers();

    expect(catalog).toEqual({
      en: 'Hello',
    });
  });

  it('holds pending patches for a catalog that registers after the sync', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    registerLocaleFileSource({
      sv: path,
    });
    runTrackers();

    const catalog = registerCatalog('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });

    expect(catalog).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });
});
