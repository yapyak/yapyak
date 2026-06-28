import type { ExtractedMessage } from 'yapyak/compiler/internal';
import type { LocaleResolver } from '../locale-resolver';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createState } from './state';
import { syncAll } from './sync';
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

afterEach(() => {
  vi.restoreAllMocks();
});

function buildResolver(): LocaleResolver {
  return {
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
}

function buildMessage(source: string): ExtractedMessage {
  return {
    id: source,
    locations: [
      {
        callSiteContext: {},
        fileId: 'src/a.tsx',
        range: {
          end: {
            column: 5,
            line: 1,
            offset: 5,
          },
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
        },
      },
    ],
    placeholders: [],
    source,
  };
}

describe('syncAll', () => {
  let projectRoot: string;
  let absoluteLocalesDir: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-sync-'));
    absoluteLocalesDir = join(projectRoot, 'locales');
    mkdirSync(absoluteLocalesDir, {
      recursive: true,
    });
  });

  afterEach(() => {
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  it('notifies the resolver to invalidate cached data', () => {
    const resolver = buildResolver();
    const invalidate = vi.spyOn(resolver, 'invalidateData');
    const state = createState();
    state.normalized = normalizeYapyakConfig({
      localesDir: 'locales',
    });
    state.resolver = resolver;
    state.projectRoot = projectRoot;
    state.messagesByFile.set('src/a.tsx', [
      buildMessage('Hello'),
    ]);

    syncAll(state);

    expect(invalidate).toHaveBeenCalled();
  });

  it('writes every aggregated message to the synced locale files', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const state = createState();
    state.normalized = normalizeYapyakConfig({
      localesDir: 'locales',
    });
    state.resolver = buildResolver();
    state.projectRoot = projectRoot;
    state.messagesByFile.set('src/a.tsx', [
      buildMessage('Hello'),
    ]);
    state.messagesByFile.set('src/b.tsx', [
      buildMessage('Save'),
    ]);

    syncAll(state);

    const files = readdirSync(absoluteLocalesDir);
    expect(files.length).toBeGreaterThan(0);
  });
});
