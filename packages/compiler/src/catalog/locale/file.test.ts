import type { ExtractedMessage, Location } from '../../parser/file/extract';
import type { LocaleFile } from './file';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { syncLocaleFiles, writeLocaleFile, YapyakInvariantError } from './file';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeMessage(source: string, fileId: string): ExtractedMessage {
  const location: Location = {
    callSiteContext: {},
    fileId,
    range: {
      end: { column: 0, line: 1, offset: 0 },
      start: { column: 0, line: 1, offset: 0 },
    },
  };
  return {
    id: source,
    locations: [location],
    placeholders: [],
    source,
  };
}

describe('syncLocaleFiles', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-sync-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { force: true, recursive: true });
  });

  it('writes an empty locale file when no messages are extracted and existing is empty', () => {
    const localesDir = 'locales';
    const localePath = join(projectRoot, localesDir, 'sv.json');

    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({});
  });

  it('preserves an existing non-empty locale file when no messages are extracted', () => {
    const localesDir = 'locales';
    const localePath = join(projectRoot, localesDir, 'sv.json');
    const existing = { 'src/a.ts': { hello: 'hej' } };
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(localePath, JSON.stringify(existing));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    syncLocaleFiles({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual(existing);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Refusing to overwrite'),
    );

    warn.mockRestore();
  });

  it('preserves a translation when its source briefly disappears via the orphan cache', () => {
    const localesDir = 'locales';
    const cacheDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(
      localePath,
      JSON.stringify({ 'src/a.tsx': { Cancel: 'Avbryt', Save: 'Spara' } }),
    );

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [makeMessage('Save', 'src/a.tsx')],
      now: () => '2026-01-01T00:00:00.000Z',
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': { Save: 'Spara' },
    });
    expect(
      JSON.parse(readFileSync(join(cacheDir, 'orphans.json'), 'utf8')),
    ).toEqual({
      'src/a.tsx': {
        Cancel: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: { sv: 'Avbryt' },
        },
      },
    });

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [
        makeMessage('Save', 'src/a.tsx'),
        makeMessage('Cancel', 'src/a.tsx'),
      ],
      now: () => '2026-01-02T00:00:00.000Z',
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': { Cancel: 'Avbryt', Save: 'Spara' },
    });
    expect(
      JSON.parse(readFileSync(join(cacheDir, 'orphans.json'), 'utf8')),
    ).toEqual({});
  });

  it('migrates translations through a same-flush file rename', () => {
    const localesDir = 'locales';
    const cacheDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': { Cancel: 'Avbryt', Save: 'Spara' },
      }),
    );

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [
        makeMessage('Save', 'src/b.tsx'),
        makeMessage('Cancel', 'src/b.tsx'),
      ],
      now: () => '2026-01-01T00:00:00.000Z',
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/b.tsx': { Cancel: 'Avbryt', Save: 'Spara' },
    });
    expect(existsSync(join(cacheDir, 'orphans.json'))).toBe(false);

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [
        makeMessage('Save', 'src/a.tsx'),
        makeMessage('Cancel', 'src/a.tsx'),
      ],
      now: () => '2026-01-02T00:00:00.000Z',
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': { Cancel: 'Avbryt', Save: 'Spara' },
    });
    expect(existsSync(join(cacheDir, 'orphans.json'))).toBe(false);
  });

  it('migrates orphan translations to a renamed file via cross-file lookup', () => {
    const localesDir = 'locales';
    const cacheDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': { Cancel: 'Avbryt', Save: 'Spara' },
      }),
    );

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      now: () => '2026-01-01T00:00:00.000Z',
      projectRoot,
    });

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [
        makeMessage('Save', 'src/b.tsx'),
        makeMessage('Cancel', 'src/b.tsx'),
      ],
      now: () => '2026-01-02T00:00:00.000Z',
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/b.tsx': { Cancel: 'Avbryt', Save: 'Spara' },
    });
    expect(
      JSON.parse(readFileSync(join(cacheDir, 'orphans.json'), 'utf8')),
    ).toEqual({});
  });

  it('writes dropped translations to the orphan cache when extraction is partial', () => {
    const localesDir = 'locales';
    const cacheDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': { Cancel: 'Avbryt', Hello: 'Hej', Save: 'Spara' },
      }),
    );

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [makeMessage('Save', 'src/a.tsx')],
      now: () => '2026-01-01T00:00:00.000Z',
      projectRoot,
    });

    const orphans = JSON.parse(
      readFileSync(join(cacheDir, 'orphans.json'), 'utf8'),
    );
    expect(orphans['src/a.tsx']).toEqual({
      Cancel: {
        deletedAt: '2026-01-01T00:00:00.000Z',
        translations: { sv: 'Avbryt' },
      },
      Hello: {
        deletedAt: '2026-01-01T00:00:00.000Z',
        translations: { sv: 'Hej' },
      },
    });
  });

  it('holds the most recent orphan when the same source exists across files', () => {
    const localesDir = 'locales';
    const cacheDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), { recursive: true });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': { Save: 'Spara' },
      }),
    );

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      now: () => '2026-01-01T00:00:00.000Z',
      projectRoot,
    });

    writeFileSync(
      localePath,
      JSON.stringify({
        'src/b.tsx': { Save: 'Spara ändringar' },
      }),
    );

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [],
      now: () => '2026-01-02T00:00:00.000Z',
      projectRoot,
    });

    syncLocaleFiles({
      cacheDir,
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir,
      messages: [makeMessage('Save', 'src/components/c.tsx')],
      now: () => '2026-01-03T00:00:00.000Z',
      projectRoot,
    });

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/components/c.tsx': { Save: 'Spara ändringar' },
    });
  });
});

describe('writeLocaleFile invariant', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-writer-'));
    path = join(dir, 'sv.json');
  });

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('throws when a still-used non-empty value would be cleared to empty string', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    expect(() =>
      writeLocaleFile({
        after: { 'src/a.tsx': { Hello: '' } },
        extractedSources: { 'src/a.tsx': new Set(['Hello']) },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('throws when a still-used non-empty value would be removed entirely', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    expect(() =>
      writeLocaleFile({
        after: { 'src/a.tsx': {} },
        extractedSources: { 'src/a.tsx': new Set(['Hello']) },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('clears the translation when source is no longer extracted', () => {
    writeFileSync(
      path,
      JSON.stringify({ 'src/a.tsx': { Hello: 'Hej', World: 'Världen' } }),
    );

    writeLocaleFile({
      after: { 'src/a.tsx': { World: 'Världen' } },
      extractedSources: { 'src/a.tsx': new Set(['World']) },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': { World: 'Världen' },
    });
  });

  it('clears values when fileId has no extracted sources', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    writeLocaleFile({
      after: {},
      extractedSources: {},
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({});
  });

  it('writes a new translation value', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: '' } }));

    writeLocaleFile({
      after: { 'src/a.tsx': { Hello: 'Hej' } },
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': { Hello: 'Hej' },
    });
  });

  it('preserves non-empty values across writes when source still extracted', () => {
    writeFileSync(path, JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }));

    writeLocaleFile({
      after: { 'src/a.tsx': { Hello: 'Hej' } },
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': { Hello: 'Hej' },
    });
  });

  it('lists all violations in the error message', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': { Hello: 'Hej', World: 'Världen' },
      }),
    );

    try {
      writeLocaleFile({
        after: { 'src/a.tsx': { Hello: '', World: '' } },
        extractedSources: { 'src/a.tsx': new Set(['Hello', 'World']) },
        filePath: path,
      });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(YapyakInvariantError);
      const invariantError = error as YapyakInvariantError;
      expect(invariantError.violations).toHaveLength(2);
      expect(invariantError.violations.map((v) => v.source).sort()).toEqual([
        'Hello',
        'World',
      ]);
    }
  });

  it('writes to a missing nested directory', () => {
    const nested = join(dir, 'deep', 'nested', 'sv.json');

    writeLocaleFile({
      after: { 'src/a.tsx': { Hello: 'Hej' } },
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: nested,
    });

    expect(JSON.parse(readFileSync(nested, 'utf8'))).toEqual({
      'src/a.tsx': { Hello: 'Hej' },
    });
  });

  it('writes no file when invariant fails', () => {
    const before = JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } });
    writeFileSync(path, before);
    mkdirSync(join(dir, 'untouched'), { recursive: true });

    expect(() =>
      writeLocaleFile({
        after: { 'src/a.tsx': { Hello: '' } },
        extractedSources: { 'src/a.tsx': new Set(['Hello']) },
        filePath: path,
      }),
    ).toThrow();

    expect(readFileSync(path, 'utf8')).toBe(before);
  });

  it('preserves the invariant across every state combination', () => {
    const FILE_ID = 'src/a.tsx';
    const SOURCE = 'Hello';
    const OLD = 'Hej';
    const NEW = 'NyttHej';

    for (const beforeState of ENTRY_STATES) {
      for (const afterState of ENTRY_STATES) {
        for (const extractedState of EXTRACTED_STATES) {
          const before = buildEntry(beforeState, FILE_ID, SOURCE, OLD);
          const after = buildEntry(afterState, FILE_ID, SOURCE, NEW);
          const extractedSources = buildExtracted(
            extractedState,
            FILE_ID,
            SOURCE,
          );
          writeFileSync(path, JSON.stringify(before));
          const beforeOnDisk = readFileSync(path, 'utf8');
          const shouldThrow =
            beforeState === 'translated' &&
            extractedState === 'has-source' &&
            afterState !== 'translated';
          const label = `before=${beforeState} after=${afterState} extracted=${extractedState}`;
          const input = {
            after,
            extractedSources,
            filePath: path,
          };

          if (shouldThrow) {
            expect(() => writeLocaleFile(input), label).toThrow(
              YapyakInvariantError,
            );
            expect(readFileSync(path, 'utf8'), label).toBe(beforeOnDisk);
          } else {
            writeLocaleFile(input);
            expect(JSON.parse(readFileSync(path, 'utf8')), label).toEqual(
              after,
            );
          }
        }
      }
    }
  });

  it('preserves the file on a second successful write', () => {
    const data: LocaleFile = { 'src/a.tsx': { Hello: 'Hej' } };
    writeFileSync(path, JSON.stringify(data));
    const input = {
      after: data,
      extractedSources: { 'src/a.tsx': new Set(['Hello']) },
      filePath: path,
    };

    writeLocaleFile(input);
    const first = readFileSync(path, 'utf8');
    writeLocaleFile(input);
    const second = readFileSync(path, 'utf8');

    expect(second).toBe(first);
  });
});

type EntryState = 'missing' | 'empty' | 'translated';
type ExtractedState = 'has-source' | 'missing-source' | 'no-file';

const ENTRY_STATES: EntryState[] = ['missing', 'empty', 'translated'];
const EXTRACTED_STATES: ExtractedState[] = [
  'has-source',
  'missing-source',
  'no-file',
];

function buildEntry(
  state: EntryState,
  fileId: string,
  source: string,
  value: string,
): LocaleFile {
  if (state === 'missing') {
    return {};
  }
  if (state === 'empty') {
    return { [fileId]: { [source]: '' } };
  }
  return { [fileId]: { [source]: value } };
}

function buildExtracted(
  state: ExtractedState,
  fileId: string,
  source: string,
): Record<string, Set<string>> {
  if (state === 'no-file') {
    return {};
  }
  if (state === 'missing-source') {
    return { [fileId]: new Set(['other']) };
  }
  return { [fileId]: new Set([source]) };
}
