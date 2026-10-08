import type { LocaleResolver } from '../locale-resolver';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createScanPlugin } from './scan';
import { createState } from './state';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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
      sourceLocale: 'en',
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
      sourceLocale: 'en',
    }),
    invalidateData: () => {},
    invalidateStructure: () => {},
  };
}

describe('createScanPlugin', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-scan-'));
    mkdirSync(join(projectRoot, 'locales'), {
      recursive: true,
    });
    mkdirSync(join(projectRoot, 'src'), {
      recursive: true,
    });
  });

  afterEach(() => {
    rmSync(projectRoot, {
      force: true,
      recursive: true,
    });
  });

  describe('buildStart', () => {
    it('blocks when the command is `build`', () => {
      const state = createState();
      state.command = 'build';
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      state.projectRoot = projectRoot;
      state.filter = () => true;
      const plugin = createScanPlugin(state);

      (plugin.buildStart as () => void).call({});

      expect(state.messagesByFile.size).toBe(0);
    });

    it('extracts messages from every source file when the command is `serve`', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      writeFileSync(
        join(projectRoot, 'src', 'a.tsx'),
        `import { t } from 'yapyak';\nt('Hello');\n`,
      );
      const state = createState();
      state.command = 'serve';
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      state.projectRoot = projectRoot;
      state.filter = () => true;
      const plugin = createScanPlugin(state);

      (plugin.buildStart as () => void).call({});

      expect(state.messagesByFile.size).toBeGreaterThan(0);
    });

    it('preserves the entries of a source file that does not parse', () => {
      writeFileSync(
        join(projectRoot, 'src', 'a.tsx'),
        `import { t } from 'yapyak';\nt('Hello';\n`,
      );
      writeFileSync(
        join(projectRoot, 'locales', 'sv.json'),
        JSON.stringify({
          'src/a.tsx': {
            Hello: 'Hej',
          },
        }),
      );
      const state = createState();
      state.command = 'serve';
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      state.projectRoot = projectRoot;
      state.filter = () => true;
      const plugin = createScanPlugin(state);

      (plugin.buildStart as () => void).call({});

      const after = JSON.parse(
        readFileSync(join(projectRoot, 'locales', 'sv.json'), 'utf-8'),
      );
      expect(after['src/a.tsx']).toEqual({
        Hello: 'Hej',
      });
    });

    it('skips a source file without `t()` calls', () => {
      writeFileSync(join(projectRoot, 'src', 'a.tsx'), 'export const x = 1;\n');
      const state = createState();
      state.command = 'serve';
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      state.projectRoot = projectRoot;
      state.filter = () => true;
      const plugin = createScanPlugin(state);

      (plugin.buildStart as () => void).call({});

      expect(state.messagesByFile.size).toBe(0);
    });
  });
});
