import type { Translator } from 'yapyak/translator';
import type { State } from './state';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toMessageKey } from 'yapyak/compiler/internal';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createDevServerPlugin, toExtractedKeysForFile } from './dev-server';
import { createState } from './state';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type ConfigureServerHook = (server: {
  moduleGraph: {
    invalidateAll: () => void;
  };
  watcher: {
    add: (path: string) => void;
    on: (event: string, handler: (path: string) => void) => void;
  };
  ws: {
    send: (payload: never) => void;
  };
}) => void;

function buildState(projectRoot: string): State {
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
  return state;
}

function buildWatcherHandlers(
  state: State,
): Map<string, (path: string) => void> {
  const handlersByEvent = new Map<string, (path: string) => void>();
  const plugin = createDevServerPlugin(state);
  const configureServer = plugin.configureServer as ConfigureServerHook;
  configureServer({
    moduleGraph: {
      invalidateAll: () => {},
    },
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
  return handlersByEvent;
}

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

  it('watches the locales directory outside the bundler root', () => {
    const state = buildState(projectRoot);
    const watched: string[] = [];
    const plugin = createDevServerPlugin(state);
    const configureServer = plugin.configureServer as ConfigureServerHook;
    configureServer({
      moduleGraph: {
        invalidateAll: () => {},
      },
      watcher: {
        add: (path) => {
          watched.push(path);
        },
        on: () => {},
      },
      ws: {
        send: () => {},
      },
    });

    expect(watched).toContain(join(projectRoot, 'locales'));
  });

  it('warns when a changed locale file cannot be read', () => {
    const state = buildState(projectRoot);
    const warn = vi.spyOn(state.logger, 'warn').mockImplementation(() => {});
    const handlersByEvent = buildWatcherHandlers(state);
    mkdirSync(join(projectRoot, 'locales', 'sv.json'));
    handlersByEvent.get('change')?.(join(projectRoot, 'locales', 'sv.json'));

    vi.advanceTimersByTime(50);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('YAP0047'));
  });

  it('renders no hint when the new locale file is fully translated', () => {
    const state = buildState(projectRoot);
    const info = vi.spyOn(state.logger, 'info').mockImplementation(() => {});
    const handlersByEvent = buildWatcherHandlers(state);
    writeFileSync(
      join(projectRoot, 'locales', 'sv.json'),
      '{"src/a.ts":{"Hello":"Hej"}}',
    );
    handlersByEvent.get('add')?.(join(projectRoot, 'locales', 'sv.json'));

    expect(info).toHaveBeenCalledWith("[yapyak] New locale 'sv' detected.");
  });

  it('renders the `translate` hint when the new locale file holds stubs', () => {
    const state = buildState(projectRoot);
    const translator: Translator = Object.assign(
      () => new Promise<string>(() => {}),
      {
        batch: () => new Promise<string[]>(() => {}),
        id: 'mock',
      },
    );
    state.normalized = normalizeYapyakConfig({
      translator,
    });
    const info = vi.spyOn(state.logger, 'info').mockImplementation(() => {});
    const handlersByEvent = buildWatcherHandlers(state);
    writeFileSync(
      join(projectRoot, 'locales', 'sv.json'),
      '{"src/a.ts":{"Hello":""}}',
    );
    handlersByEvent.get('add')?.(join(projectRoot, 'locales', 'sv.json'));

    expect(info).toHaveBeenCalledWith(
      expect.stringContaining("[yapyak] New locale 'sv' detected. `"),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining(
        'yapyak translate sv` fills anything untranslated.',
      ),
    );
  });

  it('renders the fill-in hint when no translator is configured', () => {
    const state = buildState(projectRoot);
    const info = vi.spyOn(state.logger, 'info').mockImplementation(() => {});
    const handlersByEvent = buildWatcherHandlers(state);
    writeFileSync(join(projectRoot, 'locales', 'sv.json'), '{}');
    handlersByEvent.get('add')?.(join(projectRoot, 'locales', 'sv.json'));

    expect(info).toHaveBeenCalledWith(
      "[yapyak] New locale 'sv' detected. Fill in locales/sv.json.",
    );
  });

  it('warns when a new locale file cannot be read', () => {
    const state = buildState(projectRoot);
    const warn = vi.spyOn(state.logger, 'warn').mockImplementation(() => {});
    const handlersByEvent = buildWatcherHandlers(state);
    mkdirSync(join(projectRoot, 'locales', 'sv.json'));
    handlersByEvent.get('add')?.(join(projectRoot, 'locales', 'sv.json'));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('YAP0047'));
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
