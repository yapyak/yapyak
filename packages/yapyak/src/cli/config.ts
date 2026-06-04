import type { NormalizedYapyakConfig } from '../config/internal';
import type { Processor } from '../processor';
import type { Translator } from '../translator';

import { loadYapyakConfig } from '../config/internal';

/** Configuration for the yapyak CLI. */
export interface Config {
  /** The default locale. */
  defaultLocale: string | undefined;
  /** The maximum number of prior translations passed to the translator as style reference. */
  examples: number;
  /** The directory for locale JSON files, relative to the project root. */
  localesDir: string;
  /** Processors registered for framework-specific file formats. */
  processors: Processor[];
  /** The translator configured in `yapyak.config.ts`, or `undefined` if none. */
  translator: Translator | undefined;
}

let cached: { projectRoot: string; value: Config } | undefined;

/**
 * Loads the yapyak CLI configuration from `yapyak.config.{ts,mts,mjs,js}`. Resolves to {@link Config}.
 *
 * @param projectRoot - The project root directory.
 */
export async function loadConfig(projectRoot: string): Promise<Config> {
  if (cached?.projectRoot === projectRoot) {
    return cached.value;
  }
  const { config } = await loadYapyakConfig(projectRoot);
  const value = toCliConfig(config);
  cached = { projectRoot, value };
  return value;
}

function toCliConfig(config: NormalizedYapyakConfig): Config {
  return {
    defaultLocale: config.defaultLocale,
    examples: config.examples,
    localesDir: config.localesDir,
    processors: config.processors,
    translator: config.translator,
  };
}
