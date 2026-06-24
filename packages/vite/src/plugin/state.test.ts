import type { LocaleResolver } from '../locale-resolver';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createState, getNormalized, getResolver } from './state';

afterEach(() => {
  vi.restoreAllMocks();
});

function buildResolver(): LocaleResolver {
  return {
    getDiscovery: () => ({
      defaultLocale: 'en',
      locales: [
        'en',
      ],
      warnings: [],
    }),
    getEmittedLocales: () => ({
      defaultLocale: 'en',
      locales: [
        'en',
      ],
    }),
    getLocaleData: () => ({}),
    getProjectLocales: () => ({
      defaultLocale: 'en',
      locales: [
        'en',
      ],
    }),
    invalidateData: () => {},
    invalidateStructure: () => {},
  };
}

describe('createState', () => {
  it('builds default state with `serve` command and empty messages', () => {
    const state = createState({
      fixedLocale: undefined,
    });
    expect(state.autoTranslateController).toBeUndefined();
    expect(state.command).toBe('serve');
    expect(state.configFile).toBeUndefined();
    expect(state.fixedLocale).toBeUndefined();
    expect(state.messagesByFile.size).toBe(0);
    expect(state.normalized).toBeUndefined();
    expect(state.resolver).toBeUndefined();
    expect(state.teardownCallbacks).toEqual([]);
    expect(state.yapyakDir).toBe('');
  });

  it('preserves the `fixedLocale` from options', () => {
    const state = createState({
      fixedLocale: 'sv',
    });
    expect(state.fixedLocale).toBe('sv');
  });

  it('builds a default filter that blocks every path', () => {
    const state = createState({
      fixedLocale: undefined,
    });
    expect(state.filter('src/a.tsx')).toBe(false);
  });

  it('builds a console-backed logger that notifies every level', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const state = createState({
      fixedLocale: undefined,
    });
    state.logger.clearScreen('error');
    state.logger.info('Hello');
    state.logger.warn('Hello');
    state.logger.warnOnce('Hello');
    state.logger.error('Hello');
    expect(logSpy).toHaveBeenCalledWith('Hello');
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith('Hello');
    expect(state.logger.hasErrorLogged(new Error('Hello'))).toBe(false);
    expect(state.logger.hasWarned).toBe(false);
  });
});

describe('getNormalized', () => {
  it('returns the normalized config when set', () => {
    const state = createState({
      fixedLocale: undefined,
    });
    const normalized = normalizeYapyakConfig({});
    state.normalized = normalized;
    expect(getNormalized(state)).toBe(normalized);
  });

  it('throws when the normalized config is not set', () => {
    const state = createState({
      fixedLocale: undefined,
    });
    expect(() => getNormalized(state)).toThrow(
      /plugin used before configResolved/,
    );
  });
});

describe('getResolver', () => {
  it('returns the resolver when set', () => {
    const state = createState({
      fixedLocale: undefined,
    });
    const resolver = buildResolver();
    state.resolver = resolver;
    expect(getResolver(state)).toBe(resolver);
  });

  it('throws when the resolver is not set', () => {
    const state = createState({
      fixedLocale: undefined,
    });
    expect(() => getResolver(state)).toThrow(
      /plugin used before configResolved/,
    );
  });
});
