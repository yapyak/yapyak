import type { Plugin, PluginOption } from 'vite';
import type { ViteUserConfig } from 'vitest/config';
import type { RuntimeMock } from 'yapyak/internal';

import { defineConfig as defineViteConfig } from 'vitest/config';
import { buildRuntimeMock } from 'yapyak/internal';

export interface Options extends Partial<RuntimeMock> {
  environment?: 'node' | 'happy-dom' | 'jsdom';
  plugins?: PluginOption[];
  setupFiles?: string[];
}

export function defineConfig(options: Options = {}): ViteUserConfig {
  const { environment, plugins = [], setupFiles, ...runtime } = options;
  return defineViteConfig({
    plugins: [yapyakRuntimePlugin(runtime), ...plugins],
    test: { environment, setupFiles },
  });
}

function yapyakRuntimePlugin(runtime: Partial<RuntimeMock>): Plugin {
  const RUNTIME_ID = 'yapyak/runtime';
  const RESOLVED_ID = `\0${RUNTIME_ID}`;
  return {
    enforce: 'pre',
    load(id) {
      if (id !== RESOLVED_ID) return;
      return Object.entries(buildRuntimeMock(runtime))
        .map(([key, value]) => `export const ${key} = ${stringify(value)};`)
        .join('\n');
    },
    name: '@yapyak/vitest-config:runtime',
    resolveId(source) {
      if (source === RUNTIME_ID) return RESOLVED_ID;
    },
  };
}

function stringify(value: unknown): string {
  if (value instanceof RegExp) return value.toString();
  if (Array.isArray(value)) {
    return `[${value.map(stringify).join(', ')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, child]) => `${JSON.stringify(key)}: ${stringify(child)}`)
      .join(', ');
    return `{ ${entries} }`;
  }
  return JSON.stringify(value);
}
