import type { LocaleResolver } from '../locale-resolver';

import { describe, expect, it } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { RUNTIME_ID, RUNTIME_RESOLVED } from '../virtual-runtime';
import { createState } from './state';
import { createVirtualModulePlugin } from './virtual-module';

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

describe('createVirtualModulePlugin', () => {
  describe('load', () => {
    it('returns the defined runtime source for the resolved virtual id', () => {
      const state = createState();
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      const plugin = createVirtualModulePlugin(state);
      const result = (plugin.load as (id: string) => string | null)(
        RUNTIME_RESOLVED,
      );
      expect(result).toBeTypeOf('string');
      expect(result).toContain('export');
    });

    it('returns `null` for every other id', () => {
      const state = createState();
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      const plugin = createVirtualModulePlugin(state);
      const result = (plugin.load as (id: string) => string | null)(
        'some-other-id',
      );
      expect(result).toBeNull();
    });
  });

  describe('resolveId', () => {
    it('resolves the runtime id to the resolved virtual id', () => {
      const state = createState();
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      const plugin = createVirtualModulePlugin(state);
      const result = (plugin.resolveId as (id: string) => string | null)(
        RUNTIME_ID,
      );
      expect(result).toBe(RUNTIME_RESOLVED);
    });

    it('returns `null` for every other id', () => {
      const state = createState();
      state.normalized = normalizeYapyakConfig({});
      state.resolver = buildResolver();
      const plugin = createVirtualModulePlugin(state);
      const result = (plugin.resolveId as (id: string) => string | null)(
        'some-other-id',
      );
      expect(result).toBeNull();
    });
  });
});
