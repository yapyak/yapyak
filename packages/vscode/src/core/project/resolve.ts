import type { NormalizedYapyakConfig } from 'yapyak/config/internal';

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export type CompilerModule = typeof import('yapyak/compiler/internal');

type ConfigModule = typeof import('yapyak/config/internal');

export type Project = {
  compiler: CompilerModule;
  config: NormalizedYapyakConfig;
  configModule: ConfigModule;
  root: string;
};

const CONFIG_FILES = [
  'yapyak.config.ts',
  'yapyak.config.mts',
  'yapyak.config.mjs',
  'yapyak.config.js',
];

const CONFIG_TTL_MILLISECONDS = 2000;

export async function resolveProject(
  directory: string,
): Promise<Project | undefined> {
  const root = findProjectRoot(directory);
  if (root === undefined) {
    return undefined;
  }
  try {
    const modules = await resolveModules(root);
    return {
      ...modules,
      config: await loadConfig(root, modules.configModule),
      root,
    };
  } catch {
    return undefined;
  }
}

export function findProjectRoot(directory: string): string | undefined {
  let current = directory;
  let previous = '';
  while (current !== previous) {
    for (const name of CONFIG_FILES) {
      if (existsSync(join(current, name))) {
        return current;
      }
    }
    previous = current;
    current = dirname(current);
  }
  return undefined;
}

type ProjectModules = {
  compiler: CompilerModule;
  configModule: ConfigModule;
};

const moduleCache = new Map<string, Promise<ProjectModules>>();

function resolveModules(root: string): Promise<ProjectModules> {
  let cached = moduleCache.get(root);
  if (cached === undefined) {
    cached = loadModules(root);
    moduleCache.set(root, cached);
  }
  return cached;
}

async function loadModules(root: string): Promise<ProjectModules> {
  const require = createRequire(join(root, 'package.json'));
  const compilerPath = require.resolve('yapyak/compiler/internal');
  const configPath = require.resolve('yapyak/config/internal');
  return {
    compiler: (await import(
      pathToFileURL(compilerPath).href
    )) as CompilerModule,
    configModule: (await import(
      pathToFileURL(configPath).href
    )) as ConfigModule,
  };
}

type LoadedConfig = {
  config: NormalizedYapyakConfig;
  loadedAt: number;
};

const configCache = new Map<string, LoadedConfig>();

async function loadConfig(
  root: string,
  configModule: ConfigModule,
): Promise<NormalizedYapyakConfig> {
  const cached = configCache.get(root);
  if (
    cached !== undefined &&
    Date.now() - cached.loadedAt < CONFIG_TTL_MILLISECONDS
  ) {
    return cached.config;
  }
  const { config } = await configModule.loadYapyakConfig(root);
  configCache.set(root, {
    config,
    loadedAt: Date.now(),
  });
  return config;
}
