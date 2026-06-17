import type { NormalizedYapyakConfig } from './normalize';
import type { YapyakConfig } from './type';

import { createJiti } from 'jiti';

import { normalizeYapyakConfig } from './normalize';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const CONFIG_FILES = [
  'yapyak.config.ts',
  'yapyak.config.mts',
  'yapyak.config.mjs',
  'yapyak.config.js',
];

const ENV_FILES = [
  '.env.local',
  '.env',
];

export type LoadYapyakConfigResult = {
  config: NormalizedYapyakConfig;
  configFile?: string;
};

export async function loadYapyakConfig(
  cwd: string = process.cwd(),
): Promise<LoadYapyakConfigResult> {
  for (const name of ENV_FILES) {
    const path = resolve(cwd, name);
    if (!existsSync(path)) {
      continue;
    }
    try {
      loadEnvFile(path);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`Failed to load env file ${path}: ${detail}`, {
        cause,
      });
    }
  }
  for (const name of CONFIG_FILES) {
    const path = resolve(cwd, name);
    if (!existsSync(path)) {
      continue;
    }
    const jiti = createJiti(cwd, {
      interopDefault: true,
    });
    let loaded: unknown;
    try {
      loaded = await jiti.import(path);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`Failed to load yapyak config from ${path}: ${detail}`, {
        cause,
      });
    }
    if (typeof loaded !== 'object' || loaded === null) {
      throw new Error(
        `Invalid yapyak config in ${path}: expected an object, got ${loaded === null ? 'null' : typeof loaded}.`,
      );
    }
    const raw =
      'default' in loaded
        ? (
            loaded as {
              default: YapyakConfig;
            }
          ).default
        : (loaded as YapyakConfig);
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(
        `Invalid yapyak config default export in ${path}: expected an object, got ${raw === null ? 'null' : typeof raw}.`,
      );
    }
    return {
      config: normalizeYapyakConfig(raw),
      configFile: path,
    };
  }
  return {
    config: normalizeYapyakConfig({}),
  };
}
