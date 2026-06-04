import { createJiti } from 'jiti';

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import type { YapyakConfig } from '../type';
import { normalizeYapyakConfig } from './normalize';
import type { NormalizedYapyakConfig } from './type';

const CONFIG_FILES = [
  'yapyak.config.ts',
  'yapyak.config.mts',
  'yapyak.config.mjs',
  'yapyak.config.js',
];

const ENV_FILES = ['.env.local', '.env'];

export interface LoadYapyakConfigResult {
  config: NormalizedYapyakConfig;
  configFile: string | null;
}

export async function loadYapyakConfig(
  cwd: string = process.cwd(),
): Promise<LoadYapyakConfigResult> {
  for (const name of ENV_FILES) {
    const path = resolve(cwd, name);
    if (existsSync(path)) {
      loadEnvFile(path);
    }
  }
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
