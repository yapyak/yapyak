import type { NormalizedYapyakConfig, YapyakConfig } from './types';

import { createJiti } from 'jiti';

import { normalizeYapyakConfig } from './normalize';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG_FILES = [
  'yapyak.config.ts',
  'yapyak.config.mts',
  'yapyak.config.mjs',
  'yapyak.config.js',
];

/** Result of {@link loadYapyakConfig}. */
export interface LoadYapyakConfigResult {
  /** The normalized config with defaults applied. */
  config: NormalizedYapyakConfig;
  /** The absolute path of the loaded config file, or `null` when none was found. */
  configFile: string | null;
}

/**
 * Loads the yapyak config from the project root.
 *
 * @remarks
 * Searches for `yapyak.config.{ts,mts,mjs,js}` in the given directory. Returns defaults if no file is found.
 *
 * @param cwd - The project root to search in. Defaults to `process.cwd()`.
 *
 * @example Load from project root
 * ```ts
 * import { loadYapyakConfig } from '@yapyak/config/internal';
 *
 * const { config, configFile } = await loadYapyakConfig();
 * ```
 */
export async function loadYapyakConfig(
  cwd: string = process.cwd(),
): Promise<LoadYapyakConfigResult> {
  for (const name of CONFIG_FILES) {
    const path = resolve(cwd, name);
    if (!existsSync(path)) {
      continue;
    }
    const jiti = createJiti(cwd, { interopDefault: true });
    const loaded = (await jiti.import(path)) as
      | YapyakConfig
      | { default: YapyakConfig };
    const raw =
      typeof loaded === 'object' && loaded !== null && 'default' in loaded
        ? loaded.default
        : (loaded as YapyakConfig);
    return { config: normalizeYapyakConfig(raw), configFile: path };
  }
  return { config: normalizeYapyakConfig({}), configFile: null };
}
