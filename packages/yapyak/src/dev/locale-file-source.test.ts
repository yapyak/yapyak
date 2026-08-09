import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { registerVariants, resetDevStore } from '../dev-store';
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
  it('syncs the variants with the locale file on the first tracker run', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const variants = registerVariants('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: path,
    });

    runTrackers();

    expect(variants).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });

  it('syncs the variants again when the locale file changes', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const variants = registerVariants('src/a.tsx', '["Hello",null]', {
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

    expect(variants['sv']).toBe('Hejsan');
  });

  it('drops the variant when the locale file empties the value', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const variants = registerVariants('src/a.tsx', '["Hello",null]', {
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

    expect(variants).toEqual({
      en: 'Hello',
    });
  });

  it('preserves the variants when the locale file turns corrupt', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    const variants = registerVariants('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: path,
    });
    runTrackers();

    writeFileSync(path, '{ broken');
    runTrackers();

    expect(variants['sv']).toBe('Hej');
  });

  it('skips a locale file that does not exist', () => {
    const variants = registerVariants('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });
    registerLocaleFileSource({
      sv: join(localesDir, 'missing.json'),
    });

    runTrackers();

    expect(variants).toEqual({
      en: 'Hello',
    });
  });

  it('holds pending patches for variants that register after the sync', () => {
    const path = writeLocaleFile('sv', {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    registerLocaleFileSource({
      sv: path,
    });
    runTrackers();

    const variants = registerVariants('src/a.tsx', '["Hello",null]', {
      en: 'Hello',
    });

    expect(variants).toEqual({
      en: 'Hello',
      sv: 'Hej',
    });
  });
});
