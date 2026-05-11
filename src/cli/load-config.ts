import { loadConfigFromFile, type Plugin, type PluginOption } from 'vite';

export interface YapyakCliConfig {
  defaultLocale: string | undefined;
  localesDir: string;
}

const DEFAULTS: YapyakCliConfig = {
  defaultLocale: undefined,
  localesDir: 'locales',
};

let cached: { projectRoot: string; value: YapyakCliConfig } | undefined;

export async function loadYapyakConfig(
  projectRoot: string,
): Promise<YapyakCliConfig> {
  if (cached !== undefined && cached.projectRoot === projectRoot) {
    return cached.value;
  }
  const value = await readConfig(projectRoot);
  cached = { projectRoot, value };
  return value;
}

async function readConfig(projectRoot: string): Promise<YapyakCliConfig> {
  let loaded: Awaited<ReturnType<typeof loadConfigFromFile>> = null;
  try {
    loaded = await loadConfigFromFile(
      { command: 'serve', mode: 'development' },
      undefined,
      projectRoot,
    );
  } catch {
    return DEFAULTS;
  }
  if (loaded === null) {
    return DEFAULTS;
  }
  const options = await findYapyakOptions(loaded.config.plugins);
  if (options === undefined) {
    return DEFAULTS;
  }
  return options;
}

async function findYapyakOptions(
  plugins: PluginOption[] | false | null | undefined,
): Promise<YapyakCliConfig | undefined> {
  if (!plugins) {
    return undefined;
  }
  for (const entry of plugins) {
    const found = await inspectEntry(entry);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

async function inspectEntry(
  entry: PluginOption | PluginOption[] | Promise<PluginOption | PluginOption[]>,
): Promise<YapyakCliConfig | undefined> {
  const resolved = await entry;
  if (!resolved) {
    return undefined;
  }
  if (Array.isArray(resolved)) {
    for (const nested of resolved) {
      const found = await inspectEntry(nested);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }
  const plugin = resolved as Plugin;
  if (plugin.name !== 'yapyak') {
    return undefined;
  }
  const api = plugin.api as { yapyak?: YapyakCliConfig } | undefined;
  return api?.yapyak;
}
