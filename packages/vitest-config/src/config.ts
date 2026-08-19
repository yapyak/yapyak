import type { Plugin, PluginOption } from 'vite';
import type { ViteUserConfig } from 'vitest/config';
import type { RuntimeMock } from 'yapyak/internal';

import { defineConfig as defineViteConfig } from 'vitest/config';
import { buildRuntimeMock } from 'yapyak/internal';

export type DefineConfigOptions = Partial<RuntimeMock> & {
  environment?: 'node' | 'happy-dom' | 'jsdom';
  exclude?: string[];
  plugins?: PluginOption[];
  setupFiles?: string[];
};

export function defineConfig(
  options: DefineConfigOptions = {},
): ViteUserConfig {
  const {
    environment,
    exclude,
    plugins = [],
    setupFiles,
    ...runtime
  } = options;
  return defineViteConfig({
    plugins: [
      yapyakRuntimePlugin(runtime),
      ...plugins,
    ],
    test: {
      environment,
      ...(exclude === undefined
        ? {}
        : {
            exclude,
          }),
      setupFiles,
    },
  });
}

function yapyakRuntimePlugin(runtime: Partial<RuntimeMock>): Plugin {
  const runtimeId = 'yapyak/runtime';
  const resolvedId = `\0${runtimeId}`;
  return {
    enforce: 'pre',
    load(id) {
      if (id !== resolvedId) {
        return;
      }
      return Object.entries(buildRuntimeMock(runtime))
        .map(([key, value]) => `export const ${key} = ${stringify(value)};`)
        .join('\n');
    },
    name: '@yapyak/vitest-config:runtime',
    resolveId(source) {
      if (source === runtimeId) {
        return resolvedId;
      }
      return undefined;
    },
  };
}

function stringify(value: unknown): string {
  if (value instanceof RegExp) {
    return value.toString();
  }
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
