import type { ExtractedMessage, Location } from '../../parser';
import type { LocaleFile } from './file';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../../../warn';
import { toMessageKey } from '../../parser';
import { stringifyCanonical } from '../canonical';
import {
  CorruptLocaleFileError,
  YapyakInvariantError,
  readLocaleFile,
  syncLocaleFiles,
  toEntry,
  writeLocaleFile,
} from './file';
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
      end: {
        column: 0,
        line: 1,
        offset: 0,
      },
      start: {
        column: 0,
        line: 1,
        offset: 0,
      },
    },
  };
  return {
    id: source,
    locations: [
      location,
    ],
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
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  it('writes an empty locale file when no messages are extracted and existing is empty', () => {
    const localesDir = 'locales';
    const localePath = join(projectRoot, localesDir, 'sv.json');

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({});
  });

  it('clears the locale file and moves translations to the orphan cache when no messages are extracted', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({});
    expect(
      JSON.parse(readFileSync(join(yapyakDir, 'orphans.json'), 'utf8')),
    ).toEqual({
      'src/a.tsx': {
        [toMessageKey('Save')]: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: {
            sv: 'Spara',
          },
        },
      },
    });
  });

  it('preserves a translation when its source briefly disappears via the orphan cache', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': {
        Save: 'Spara',
      },
    });
    expect(
      JSON.parse(readFileSync(join(yapyakDir, 'orphans.json'), 'utf8')),
    ).toEqual({
      'src/a.tsx': {
        [toMessageKey('Cancel')]: {
          deletedAt: '2026-01-01T00:00:00.000Z',
          translations: {
            sv: 'Avbryt',
          },
        },
      },
    });

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
          makeMessage('Cancel', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-02T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
    expect(
      JSON.parse(readFileSync(join(yapyakDir, 'orphans.json'), 'utf8')),
    ).toEqual({});
  });

  it('migrates translations through a same-flush file rename', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/b.tsx'),
          makeMessage('Cancel', 'src/b.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/b.tsx': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
    expect(existsSync(join(yapyakDir, 'orphans.json'))).toBe(false);

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
          makeMessage('Cancel', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-02T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
    expect(existsSync(join(yapyakDir, 'orphans.json'))).toBe(false);
  });

  it('migrates orphan translations to a renamed file via cross-file lookup', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/b.tsx'),
          makeMessage('Cancel', 'src/b.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-02T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/b.tsx': {
        Cancel: 'Avbryt',
        Save: 'Spara',
      },
    });
    expect(
      JSON.parse(readFileSync(join(yapyakDir, 'orphans.json'), 'utf8')),
    ).toEqual({});
  });

  it('writes dropped translations to the orphan cache when extraction is partial', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Hello: 'Hej',
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    const orphans = JSON.parse(
      readFileSync(join(yapyakDir, 'orphans.json'), 'utf8'),
    );
    expect(orphans['src/a.tsx']).toEqual({
      [toMessageKey('Cancel')]: {
        deletedAt: '2026-01-01T00:00:00.000Z',
        translations: {
          sv: 'Avbryt',
        },
      },
      [toMessageKey('Hello')]: {
        deletedAt: '2026-01-01T00:00:00.000Z',
        translations: {
          sv: 'Hej',
        },
      },
    });
  });

  it('holds the most recent orphan when the same source exists across files', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    writeFileSync(
      localePath,
      JSON.stringify({
        'src/b.tsx': {
          Save: 'Spara ändringar',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-02T00:00:00.000Z',
        yapyakDir,
      },
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/components/c.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-03T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/components/c.tsx': {
        Save: 'Spara ändringar',
      },
    });
  });

  it('preserves a corrupt locale file untouched when sync is requested', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    const corruptContent = '{ "src/a.tsx": { "Save": "Spara"';
    writeFileSync(localePath, corruptContent);

    const warnSpy = vi.fn();
    setWarn(warnSpy);
    try {
      syncLocaleFiles(
        {
          filter: () => true,
          messages: [
            makeMessage('Save', 'src/a.tsx'),
          ],
        },
        {
          defaultLocale: 'en',
          locales: [
            'en',
            'sv',
          ],
          localesDir,
        },
        projectRoot,
        {
          now: () => '2026-01-01T00:00:00.000Z',
          yapyakDir,
        },
      );

      expect(readFileSync(localePath, 'utf8')).toBe(corruptContent);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse locale file'),
        expect.objectContaining({
          code: 'YAP0031',
        }),
      );
    } finally {
      resetWarn();
    }
  });

  it('preserves entries for files outside the filter scope', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
        'src/a.vue': {
          Hello: 'Hej',
        },
      }),
    );

    const result = syncLocaleFiles(
      {
        filter: (fileId) => fileId.endsWith('.tsx'),
        messages: [
          makeMessage('Hello', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(JSON.parse(readFileSync(localePath, 'utf8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
      'src/a.vue': {
        Hello: 'Hej',
      },
    });
    expect(result.orphaned).toEqual([]);
    expect(existsSync(join(yapyakDir, 'orphans.json'))).toBe(false);
  });

  it('returns orphaned diagnostics for sources removed from scoped files', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      }),
    );

    const result = syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(result.orphaned).toEqual([
      {
        fileId: 'src/a.tsx',
        locale: 'sv',
        source: 'Cancel',
      },
    ]);
  });

  it('returns restored diagnostics when a source reappears from the orphan cache', () => {
    const localesDir = 'locales';
    const yapyakDir = join(projectRoot, 'cache');
    const localePath = join(projectRoot, localesDir, 'sv.json');
    mkdirSync(join(projectRoot, localesDir), {
      recursive: true,
    });
    writeFileSync(
      localePath,
      JSON.stringify({
        'src/a.tsx': {
          Cancel: 'Avbryt',
          Save: 'Spara',
        },
      }),
    );

    syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-01T00:00:00.000Z',
        yapyakDir,
      },
    );

    const result = syncLocaleFiles(
      {
        filter: () => true,
        messages: [
          makeMessage('Save', 'src/a.tsx'),
          makeMessage('Cancel', 'src/a.tsx'),
        ],
      },
      {
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        localesDir,
      },
      projectRoot,
      {
        now: () => '2026-01-02T00:00:00.000Z',
        yapyakDir,
      },
    );

    expect(result.restored).toEqual([
      {
        fileId: 'src/a.tsx',
        locale: 'sv',
        source: 'Cancel',
      },
    ]);
  });
});

describe('readLocaleFile', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'yapyak-corrupt-'));
    path = join(dir, 'sv.json');
  });

  afterEach(() => {
    rmSync(dir, {
      force: true,
      recursive: true,
    });
  });

  it('throws CorruptLocaleFileError when the JSON is malformed', () => {
    writeFileSync(path, '{ "src/a.tsx": { "Save": "Spara"');

    expect(() => readLocaleFile(path)).toThrow(CorruptLocaleFileError);
  });

  it('returns an empty object when the file is missing', () => {
    expect(readLocaleFile(path)).toEqual({});
  });

  it('returns an empty object when the file contains only whitespace', () => {
    writeFileSync(path, '   \n  ');

    expect(readLocaleFile(path)).toEqual({});
  });

  it('reads a plain string entry as a source translation', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          'Save changes': 'Spara ändringar',
        },
      }),
    );

    expect(readLocaleFile(path)).toEqual({
      'src/a.tsx': {
        'Save changes': 'Spara ändringar',
      },
    });
  });

  it('reads an object entry as translations by context', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Save: {
            button: 'Spara',
            toolbar: 'Spara',
          },
        },
      }),
    );

    expect(readLocaleFile(path)).toEqual({
      'src/a.tsx': {
        Save: {
          button: 'Spara',
          toolbar: 'Spara',
        },
      },
    });
  });

  it('reads a `__proto__` context as an own translation', () => {
    writeFileSync(
      path,
      '{ "src/a.tsx": { "Save": { "__proto__": "Spara" } } }',
    );

    const entry = readLocaleFile(path)['src/a.tsx']?.Save;
    expect(typeof entry === 'object' && Object.hasOwn(entry, '__proto__')).toBe(
      true,
    );
  });

  it('refuses to set the result prototype when the JSON has a top-level `__proto__` key', () => {
    writeFileSync(
      path,
      '{"__proto__":{"leaked":{"Hello":"PWNED"}},"src/b.ts":{"Hello":"Hej"}}',
    );

    const result = readLocaleFile(path);
    expect(Object.getPrototypeOf(result)).toBeNull();
    expect(Object.keys(result)).toEqual([
      'src/b.ts',
    ]);
  });

  it('skips `constructor` and `prototype` keys at the top level', () => {
    writeFileSync(
      path,
      '{"constructor":{"Hello":"X"},"prototype":{"Hello":"Y"},"src/a.ts":{"Hello":"Hej"}}',
    );

    const result = readLocaleFile(path);
    expect(Object.keys(result)).toEqual([
      'src/a.ts',
    ]);
  });

  it('preserves plain and by-context entries through a roundtrip', () => {
    const catalog = {
      'src/a.tsx': {
        Save: {
          button: 'Spara',
          toolbar: 'Spara',
        },
        'Save changes': 'Spara ändringar',
      },
    };
    writeFileSync(path, stringifyCanonical(catalog));

    expect(readLocaleFile(path)).toEqual(catalog);
  });
});

describe('toEntry', () => {
  it('returns the plain value as a string when no context variants exist', () => {
    const byContext = new Map<string | undefined, string>([
      [
        undefined,
        'Spara',
      ],
    ]);
    expect(toEntry(byContext, 'Save', 'src/a.tsx')).toBe('Spara');
  });

  it('returns a context-variant record when no plain value exists', () => {
    const byContext = new Map<string | undefined, string>([
      [
        'button',
        'Spara',
      ],
      [
        'toolbar',
        'Spara',
      ],
    ]);
    expect(toEntry(byContext, 'Save', 'src/a.tsx')).toEqual({
      button: 'Spara',
      toolbar: 'Spara',
    });
  });

  it('throws a `YAP0018` error when the source has both a plain value and a context variant', () => {
    const byContext = new Map<string | undefined, string>([
      [
        undefined,
        'Spara',
      ],
      [
        'button',
        'Spara',
      ],
    ]);
    expect(() => toEntry(byContext, 'Save', 'src/a.tsx')).toThrow(/YAP0018/);
    expect(() => toEntry(byContext, 'Save', 'src/a.tsx')).toThrow(/"Save"/);
    expect(() => toEntry(byContext, 'Save', 'src/a.tsx')).toThrow(
      /src\/a\.tsx/,
    );
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
    rmSync(dir, {
      force: true,
      recursive: true,
    });
  });

  it('throws when a still-used non-empty value would be cleared to empty string', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );

    expect(() =>
      writeLocaleFile({
        after: {
          'src/a.tsx': {
            Hello: '',
          },
        },
        extractedKeys: {
          'src/a.tsx': new Set([
            toMessageKey('Hello'),
          ]),
        },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('throws when a still-used non-empty value would be removed entirely', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );

    expect(() =>
      writeLocaleFile({
        after: {
          'src/a.tsx': {},
        },
        extractedKeys: {
          'src/a.tsx': new Set([
            toMessageKey('Hello'),
          ]),
        },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('throws when a still-used context variant would be cleared', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Save: {
            button: 'Spara',
          },
        },
      }),
    );

    expect(() =>
      writeLocaleFile({
        after: {
          'src/a.tsx': {},
        },
        extractedKeys: {
          'src/a.tsx': new Set([
            toMessageKey('Save', 'button'),
          ]),
        },
        filePath: path,
      }),
    ).toThrow(YapyakInvariantError);
  });

  it('clears the translation when source is no longer extracted', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
          World: 'Världen',
        },
      }),
    );

    writeLocaleFile({
      after: {
        'src/a.tsx': {
          World: 'Världen',
        },
      },
      extractedKeys: {
        'src/a.tsx': new Set([
          toMessageKey('World'),
        ]),
      },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': {
        World: 'Världen',
      },
    });
  });

  it('clears values when fileId has no extracted sources', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );

    writeLocaleFile({
      after: {},
      extractedKeys: {},
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({});
  });

  it('writes a new translation value', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: '',
        },
      }),
    );

    writeLocaleFile({
      after: {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
      extractedKeys: {
        'src/a.tsx': new Set([
          toMessageKey('Hello'),
        ]),
      },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('preserves non-empty values across writes when source still extracted', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
        },
      }),
    );

    writeLocaleFile({
      after: {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
      extractedKeys: {
        'src/a.tsx': new Set([
          toMessageKey('Hello'),
        ]),
      },
      filePath: path,
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('lists all violations in the error message', () => {
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.tsx': {
          Hello: 'Hej',
          World: 'Världen',
        },
      }),
    );

    try {
      writeLocaleFile({
        after: {
          'src/a.tsx': {
            Hello: '',
            World: '',
          },
        },
        extractedKeys: {
          'src/a.tsx': new Set([
            toMessageKey('Hello'),
            toMessageKey('World'),
          ]),
        },
        filePath: path,
      });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(YapyakInvariantError);
      const invariantError = error as YapyakInvariantError;
      expect(invariantError.violations).toHaveLength(2);
      expect(
        invariantError.violations.map((violation) => violation.source).sort(),
      ).toEqual([
        'Hello',
        'World',
      ]);
    }
  });

  it('writes to a missing nested directory', () => {
    const nested = join(dir, 'deep', 'nested', 'sv.json');

    writeLocaleFile({
      after: {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
      extractedKeys: {
        'src/a.tsx': new Set([
          toMessageKey('Hello'),
        ]),
      },
      filePath: nested,
    });

    expect(JSON.parse(readFileSync(nested, 'utf8'))).toEqual({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
  });

  it('writes no file when invariant fails', () => {
    const before = JSON.stringify({
      'src/a.tsx': {
        Hello: 'Hej',
      },
    });
    writeFileSync(path, before);
    mkdirSync(join(dir, 'untouched'), {
      recursive: true,
    });

    expect(() =>
      writeLocaleFile({
        after: {
          'src/a.tsx': {
            Hello: '',
          },
        },
        extractedKeys: {
          'src/a.tsx': new Set([
            toMessageKey('Hello'),
          ]),
        },
        filePath: path,
      }),
    ).toThrow();

    expect(readFileSync(path, 'utf8')).toBe(before);
  });

  it('preserves the invariant across every state combination', () => {
    const fileId = 'src/a.tsx';
    const source = 'Hello';
    const previous = 'Hej';
    const next = 'NyttHej';

    for (const beforeState of ENTRY_STATES) {
      for (const afterState of ENTRY_STATES) {
        for (const extractedState of EXTRACTED_STATES) {
          const before = buildEntry(beforeState, fileId, source, previous);
          const after = buildEntry(afterState, fileId, source, next);
          const extractedKeys = buildExtracted(extractedState, fileId, source);
          writeFileSync(path, JSON.stringify(before));
          const beforeOnDisk = readFileSync(path, 'utf8');
          const shouldThrow =
            beforeState === 'translated' &&
            extractedState === 'has-source' &&
            afterState !== 'translated';
          const label = `before=${beforeState} after=${afterState} extracted=${extractedState}`;
          const input = {
            after,
            extractedKeys,
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
    const data: LocaleFile = {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    };
    writeFileSync(path, JSON.stringify(data));
    const input = {
      after: data,
      extractedKeys: {
        'src/a.tsx': new Set([
          toMessageKey('Hello'),
        ]),
      },
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

const ENTRY_STATES: EntryState[] = [
  'missing',
  'empty',
  'translated',
];
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
    return {
      [fileId]: {
        [source]: '',
      },
    };
  }
  return {
    [fileId]: {
      [source]: value,
    },
  };
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
    return {
      [fileId]: new Set([
        toMessageKey('other'),
      ]),
    };
  }
  return {
    [fileId]: new Set([
      toMessageKey(source),
    ]),
  };
}
