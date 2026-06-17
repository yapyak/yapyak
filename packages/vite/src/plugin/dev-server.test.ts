import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { toMessageKey } from 'yapyak/compiler/internal';

import {
  derivePatches,
  readLocaleFile,
  toExtractedKeysForFile,
} from './dev-server';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('derivePatches', () => {
  it('returns no patches when before and after match', () => {
    const file = {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    };
    expect(derivePatches(file, file, 'sv')).toEqual([]);
  });

  it('emits a patch when a simple value changes', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
      {
        'src/a.tsx': {
          Hello: 'Hejsan',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Hello',
          null,
        ]),
        locale: 'sv',
        value: 'Hejsan',
      },
    ]);
  });

  it('emits a patch when a source key is new', () => {
    const patches = derivePatches(
      {},
      {
        'src/a.tsx': {
          Save: 'Spara',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Save',
          null,
        ]),
        locale: 'sv',
        value: 'Spara',
      },
    ]);
  });

  it('emits a context-keyed patch when a context-variant value changes', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Save: {
            button: 'Spara',
          },
        },
      },
      {
        'src/a.tsx': {
          Save: {
            button: 'Spara nu',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Save',
          'button',
        ]),
        locale: 'sv',
        value: 'Spara nu',
      },
    ]);
  });

  it('emits a Template patch when the value holds an ICU placeholder', () => {
    const patches = derivePatches(
      {},
      {
        'src/a.tsx': {
          'Hi {name}': 'Hej {name}',
        },
      },
      'sv',
    );
    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({
      fileId: 'src/a.tsx',
      id: JSON.stringify([
        'Hi {name}',
        null,
      ]),
      locale: 'sv',
    });
    expect(Array.isArray(patches[0]?.value)).toBe(true);
  });

  it('emits an empty-string patch when a source key is removed', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Save: 'Spara',
        },
      },
      {},
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Save',
          null,
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });
});

describe('readLocaleFile', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'yapyak-vite-dev-server-'));
  });

  afterEach(() => {
    rmSync(directory, {
      force: true,
      recursive: true,
    });
  });

  it('reads and parses a locale file', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.ts': {
          Hello: 'Hej',
        },
      }),
    );
    expect(readLocaleFile(path)).toEqual({
      'src/a.ts': {
        Hello: 'Hej',
      },
    });
  });

  it('returns an empty object when the file does not exist', () => {
    expect(readLocaleFile(join(directory, 'missing.json'))).toEqual({});
  });

  it('returns an empty object for invalid JSON', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(path, '{ not valid');
    expect(readLocaleFile(path)).toEqual({});
  });

  it('returns an empty object when the parsed value is not an object', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(path, '["array", "not", "object"]');
    expect(readLocaleFile(path)).toEqual({});
  });

  it('normalizes source keys to NFC like the canonical reader', () => {
    const path = join(directory, 'sv.json');
    const nfdKey = 'Cafe\u0301';
    writeFileSync(
      path,
      JSON.stringify({
        'src/a.ts': {
          [nfdKey]: 'Caf\u00e9',
        },
      }),
    );
    const entries = readLocaleFile(path)['src/a.ts'];
    expect(entries).toBeDefined();
    expect(Object.keys(entries ?? {})).toEqual([
      'Caf\u00e9'.normalize(),
    ]);
  });

  it('refuses to set the result prototype when the JSON has a top-level `__proto__` key', () => {
    const path = join(directory, 'sv.json');
    writeFileSync(
      path,
      '{"__proto__":{"leaked":{"Hello":"PWNED"}},"src/a.ts":{"Hello":"Hej"}}',
    );
    const result = readLocaleFile(path);
    expect(Object.getPrototypeOf(result)).toBeNull();
    expect(Object.keys(result)).toEqual([
      'src/a.ts',
    ]);
  });
});

describe('toExtractedKeysForFile', () => {
  it('builds the key set using toMessageKey for sources without context', () => {
    const result = toExtractedKeysForFile('src/a.ts', [
      {
        id: 'Save',
        locations: [],
        placeholders: [],
        source: 'Save',
      },
    ]);
    expect(result).toEqual({
      'src/a.ts': new Set([
        toMessageKey('Save'),
      ]),
    });
  });

  it('builds the key set using toMessageKey for context-bearing sources', () => {
    const result = toExtractedKeysForFile('src/a.ts', [
      {
        context: 'button',
        id: 'Save',
        locations: [],
        placeholders: [],
        source: 'Save',
      },
    ]);
    expect(result).toEqual({
      'src/a.ts': new Set([
        toMessageKey('Save', 'button'),
      ]),
    });
  });

  it('emits separate keys for same source with and without context', () => {
    const result = toExtractedKeysForFile('src/a.ts', [
      {
        id: 'Save',
        locations: [],
        placeholders: [],
        source: 'Save',
      },
      {
        context: 'button',
        id: 'Save',
        locations: [],
        placeholders: [],
        source: 'Save',
      },
    ]);
    expect(result['src/a.ts']).toEqual(
      new Set([
        toMessageKey('Save'),
        toMessageKey('Save', 'button'),
      ]),
    );
  });
});
