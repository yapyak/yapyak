import type { LocaleResolver } from '../locale-resolver';

import { describe, expect, it, vi } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createState } from './state';
import { createTransformPlugin } from './transform';
import { join } from 'node:path';

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
    getLocaleData: () => ({
      sv: {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
    }),
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

type TransformHookResult = {
  code: string;
  map: unknown;
} | null;

type TransformHook = (code: string, id: string) => TransformHookResult;

type WatchChangeHook = (
  id: string,
  change: {
    event: 'create' | 'delete' | 'update';
  },
) => void;

function buildState(projectRoot: string) {
  const state = createState();
  state.normalized = normalizeYapyakConfig({});
  state.resolver = buildResolver();
  state.projectRoot = projectRoot;
  state.filter = () => true;
  return state;
}

describe('createTransformPlugin', () => {
  describe('transform', () => {
    it('returns `null` for a virtual module id', () => {
      const state = buildState('/project');
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;

      const result = transform.call(
        {} as ThisParameterType<TransformHook>,
        `import { t } from 'yapyak';\nt('Hello');\n`,
        '\0virtual:something',
      );

      expect(result).toBeNull();
    });

    it('returns `null` for an id with a `?raw` query', () => {
      const state = buildState('/project');
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;

      const result = transform.call(
        {} as ThisParameterType<TransformHook>,
        `import { t } from 'yapyak';\nt('Hello');\n`,
        '/project/src/a.tsx?raw',
      );

      expect(result).toBeNull();
    });

    it('returns `null` when the source has no `yapyak` import', () => {
      const state = buildState('/project');
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;

      const result = transform.call(
        {} as ThisParameterType<TransformHook>,
        'const value = 1;\n',
        '/project/src/a.tsx',
      );

      expect(result).toBeNull();
    });

    it('returns `null` when the source has no `t()` calls', () => {
      const state = buildState('/project');
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;

      const result = transform.call(
        {} as ThisParameterType<TransformHook>,
        `import { locales } from 'yapyak';\nconst value = locales;\n`,
        '/project/src/a.tsx',
      );

      expect(result).toBeNull();
    });

    it('transforms a source with `t()` calls into rewritten code', () => {
      const state = buildState('/project');
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;

      const result = transform.call(
        {} as ThisParameterType<TransformHook>,
        `import { t } from 'yapyak';\nt('Hello');\n`,
        '/project/src/a.tsx',
      );

      expect(result).not.toBeNull();
      expect(result?.code).toContain('Hello');
    });

    it('registers every locale file as a watch file when building', () => {
      const state = buildState('/project');
      state.command = 'build';
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;
      const addWatchFile = vi.fn();

      transform.call(
        {
          addWatchFile,
        } as ThisParameterType<TransformHook>,
        `import { t } from 'yapyak';\nt('Hello');\n`,
        '/project/src/a.tsx',
      );

      expect(addWatchFile).toHaveBeenCalledWith(
        join('/project', 'locales', 'en.json'),
      );
      expect(addWatchFile).toHaveBeenCalledWith(
        join('/project', 'locales', 'sv.json'),
      );
    });

    it('registers no watch file when serving', () => {
      const state = buildState('/project');
      const plugin = createTransformPlugin(state);
      const transform = plugin.transform as TransformHook;
      const addWatchFile = vi.fn();

      transform.call(
        {
          addWatchFile,
        } as ThisParameterType<TransformHook>,
        `import { t } from 'yapyak';\nt('Hello');\n`,
        '/project/src/a.tsx',
      );

      expect(addWatchFile).not.toHaveBeenCalled();
    });
  });

  describe('watchChange', () => {
    it('clears the locale data when a locale file changes', () => {
      const state = buildState('/project');
      state.command = 'build';
      const invalidateData = vi.fn();
      const invalidateStructure = vi.fn();
      state.resolver = {
        ...buildResolver(),
        invalidateData,
        invalidateStructure,
      };
      const plugin = createTransformPlugin(state);
      const watchChange = plugin.watchChange as WatchChangeHook;

      watchChange('/project/locales/sv.json', {
        event: 'update',
      });

      expect(invalidateData).toHaveBeenCalledOnce();
      expect(invalidateStructure).not.toHaveBeenCalled();
    });

    it('clears the locale structure when a locale file is added', () => {
      const state = buildState('/project');
      state.command = 'build';
      const invalidateData = vi.fn();
      const invalidateStructure = vi.fn();
      state.resolver = {
        ...buildResolver(),
        invalidateData,
        invalidateStructure,
      };
      const plugin = createTransformPlugin(state);
      const watchChange = plugin.watchChange as WatchChangeHook;

      watchChange('/project/locales/de.json', {
        event: 'create',
      });

      expect(invalidateStructure).toHaveBeenCalledOnce();
      expect(invalidateData).not.toHaveBeenCalled();
    });

    it('skips invalidation when serving', () => {
      const state = buildState('/project');
      const invalidateData = vi.fn();
      const invalidateStructure = vi.fn();
      state.resolver = {
        ...buildResolver(),
        invalidateData,
        invalidateStructure,
      };
      const plugin = createTransformPlugin(state);
      const watchChange = plugin.watchChange as WatchChangeHook;

      watchChange('/project/locales/sv.json', {
        event: 'update',
      });

      expect(invalidateData).not.toHaveBeenCalled();
      expect(invalidateStructure).not.toHaveBeenCalled();
    });

    it('skips invalidation for a file outside the locales directory', () => {
      const state = buildState('/project');
      state.command = 'build';
      const invalidateData = vi.fn();
      const invalidateStructure = vi.fn();
      state.resolver = {
        ...buildResolver(),
        invalidateData,
        invalidateStructure,
      };
      const plugin = createTransformPlugin(state);
      const watchChange = plugin.watchChange as WatchChangeHook;

      watchChange('/project/src/a.tsx', {
        event: 'update',
      });

      expect(invalidateData).not.toHaveBeenCalled();
      expect(invalidateStructure).not.toHaveBeenCalled();
    });
  });
});
