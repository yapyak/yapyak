import type { Plugin } from 'vite';
import type { State } from './state';

import { defineRuntime } from 'yapyak/config/internal';

import { HMR_LISTENER, RUNTIME_ID, RUNTIME_RESOLVED } from '../virtual-runtime';

export function createVirtualModulePlugin(state: State): Plugin {
  return {
    load(id: string): string | null {
      if (id === RUNTIME_RESOLVED) {
        const normalized = state.getNormalized();
        const emitted = state.getResolver().getEmittedLocales();
        const runtime = defineRuntime({
          defaultLocale: emitted.defaultLocale,
          detectAcceptLanguage: normalized.detectAcceptLanguage,
          locales: emitted.locales,
          persistence: normalized.persistence,
          syncHtmlLang: normalized.syncHtmlLang,
        });
        return `${runtime}\n${HMR_LISTENER}`;
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
