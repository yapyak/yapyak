import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toMessageKey } from 'yapyak/compiler/internal';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import {
  createDevServerPlugin,
  derivePatches,
  toExtractedKeysForFile,
} from './dev-server';
import { createState } from './state';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type ConfigureServerHook = (server: {
  watcher: {
    add: (path: string) => void;
    on: (event: string, handler: (path: string) => void) => void;
  };
  ws: {
    send: (payload: never) => void;
  };
}) => void;

describe('createDevServerPlugin', () => {
  let projectRoot: string;

  beforeEach(() => {
    vi.useFakeTimers();
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-dev-server-'));
    mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  it('writes a logger error when a locale file read throws inside a debounced callback', () => {
    const state = createState();
    state.normalized = normalizeYapyakConfig({});
    state.projectRoot = projectRoot;
    state.resolver = {
      getDiscovery: () => ({
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
        warnings: [],
      }),
      getEmittedLocales: () => ({
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
      }),
      getLocaleData: () => ({}),
      getProjectLocales: () => ({
        defaultLocale: 'en',
        locales: [
          'en',
          'sv',
        ],
      }),
      invalidateData: () => {},
      invalidateStructure: () => {},
    };
    const error = vi.spyOn(state.logger, 'error').mockImplementation(() => {});
    const handlersByEvent = new Map<string, (path: string) => void>();
    const plugin = createDevServerPlugin(state);
    const configureServer = plugin.configureServer as ConfigureServerHook;
    configureServer({
      watcher: {
        add: () => {},
        on: (event, handler) => {
          handlersByEvent.set(event, handler);
        },
      },
      ws: {
        send: () => {},
      },
    });
    mkdirSync(join(projectRoot, 'locales', 'sv.json'));
    handlersByEvent.get('change')?.(join(projectRoot, 'locales', 'sv.json'));

    vi.advanceTimersByTime(50);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[yapyak]'));
  });
});

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

  it('emits a context-keyed patch when a context map is new', () => {
    const patches = derivePatches(
      {},
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('returns no patches when a context-variant value is unchanged', () => {
    const file = {
      'src/a.tsx': {
        Open: {
          button: 'Öppna',
        },
      },
    };
    expect(derivePatches(file, file, 'sv')).toEqual([]);
  });

  it('emits an empty-string patch when a context variant is removed', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      },
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'badge',
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });

  it('emits an empty-string patch when a context map is removed', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      {},
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });

  it('emits an empty-string plain-key patch when an entry becomes a context map', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Open: 'Öppna',
        },
      },
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          null,
        ]),
        locale: 'sv',
        value: '',
      },
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('emits empty-string context patches when an entry becomes a plain string', () => {
    const patches = derivePatches(
      {
        'src/a.tsx': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      },
      {
        'src/a.tsx': {
          Open: 'Öppna',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'badge',
        ]),
        locale: 'sv',
        value: '',
      },
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: '',
      },
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          null,
        ]),
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('emits an empty-string patch when the value is an empty stub', () => {
    const patches = derivePatches(
      {},
      {
        'src/a.tsx': {
          Hello: '',
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
        value: '',
      },
    ]);
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
