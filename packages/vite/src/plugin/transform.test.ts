import type { LocaleResolver } from '../locale-resolver';

import { describe, expect, it } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createState } from './state';
import { createTransformPlugin } from './transform';

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

    it('returns `null` when the source has no `t()` calls', () => {
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
  });
});
