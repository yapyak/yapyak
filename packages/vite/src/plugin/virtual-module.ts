import type { Plugin } from 'vite';
import type { State } from './state';

import { defineRuntime } from 'yapyak/config/internal';

import { RUNTIME_ID, RUNTIME_RESOLVED } from '../virtual-runtime';
import { getNormalized, getResolver } from './state';

export function createVirtualModulePlugin(state: State): Plugin {
  return {
    enforce: 'pre',
    load(id: string): string | null {
      if (id === RUNTIME_RESOLVED) {
        const normalized = getNormalized(state);
        const emitted = getResolver(state).getEmittedLocales();
        return defineRuntime({
          defaultLocale: emitted.defaultLocale,
          detectUserLocale: normalized.detectUserLocale,
          locales: emitted.locales,
          persistence: normalized.persistence,
          syncHtmlAttributes: normalized.syncHtmlAttributes,
        });
      }
      return null;
    },
    name: 'yapyak:virtual-module',
    resolveId(id: string): string | null {
      if (id === RUNTIME_ID) {
        return RUNTIME_RESOLVED;
      }
      return null;
    },
  };
}
