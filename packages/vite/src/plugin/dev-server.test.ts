import { describe, expect, it } from 'vitest';
import { toMessageKey } from 'yapyak/compiler/internal';

import { derivePatches, toExtractedKeysForFile } from './dev-server';

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
