import type { NormalizedYapyakConfig } from 'yapyak/config/internal';

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export type CompilerModule = typeof import('yapyak/compiler/internal');

type ConfigModule = typeof import('yapyak/config/internal');

type TemplateModule = typeof import('yapyak/template/internal');

export type Project = {
  compiler: CompilerModule;
  config: NormalizedYapyakConfig;
  configModule: ConfigModule;
  root: string;
  template: TemplateModule | undefined;
};

export type ResolveIdFn = (base: string, id: string) => string;

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

export function resolveThroughScope(
  root: string,
  id: string,
  resolve: ResolveIdFn,
): string {
  const anchor = join(root, 'package.json');
  try {
    return resolve(anchor, id);
  } catch {
    const names = readScopedDependencyNames(anchor);
    for (const name of names) {
      try {
        return resolve(resolve(anchor, name), id);
      } catch {}
    }
    throw new Error(
      `[yapyak] Cannot resolve '${id}' from ${root}. ` +
        'Install yapyak in the project, or a @yapyak package that ships it.',
    );
  }
}

type ProjectModules = {
  compiler: CompilerModule;
  configModule: ConfigModule;
  template: TemplateModule | undefined;
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

function readScopedDependencyNames(anchor: string): string[] {
  let manifest: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    manifest = JSON.parse(readFileSync(anchor, 'utf8')) as typeof manifest;
  } catch {
    return [];
  }
  const names = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
  return [
    ...names,
  ]
    .filter((name) => name.startsWith('@yapyak/'))
    .sort();
}

function resolveId(base: string, id: string): string {
  return createRequire(base).resolve(id);
}

async function loadModules(root: string): Promise<ProjectModules> {
  const compilerPath = resolveThroughScope(
    root,
    'yapyak/compiler/internal',
    resolveId,
  );
  const configPath = resolveThroughScope(
    root,
    'yapyak/config/internal',
    resolveId,
  );
  return {
    compiler: (await import(
      pathToFileURL(compilerPath).href
    )) as CompilerModule,
    configModule: (await import(
      pathToFileURL(configPath).href
    )) as ConfigModule,
    template: await loadTemplate(root),
  };
}

async function loadTemplate(root: string): Promise<TemplateModule | undefined> {
  try {
    const templatePath = resolveThroughScope(
      root,
      'yapyak/template/internal',
      resolveId,
    );
    return (await import(pathToFileURL(templatePath).href)) as TemplateModule;
  } catch {
    return undefined;
  }
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
