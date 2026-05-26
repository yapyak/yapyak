import type { NormalizedYapyakConfig } from '@yapyak/config';
import type { Translator } from '@yapyak/translator';

import { loadYapyakConfig as loadFromFile } from '@yapyak/config';

/** Configuration for the yapyak CLI. */
export interface YapyakCliConfig {
  /** The default locale. */
  defaultLocale: string | undefined;
  /** The directory for locale JSON files, relative to the project root. */
  localesDir: string;
  /** The translator configured in `yapyak.config.ts`, or `undefined` if none. */
  translator: Translator | undefined;
}

let cached: { projectRoot: string; value: YapyakCliConfig } | undefined;

/**
 * Loads the yapyak CLI configuration from `yapyak.config.{ts,mts,mjs,js}`. Resolves to {@link YapyakCliConfig}.
 *
 * @param projectRoot - The project root directory.
 */
export async function loadYapyakConfig(
  projectRoot: string,
): Promise<YapyakCliConfig> {
  if (cached?.projectRoot === projectRoot) {
    return cached.value;
  }
  const { config } = await loadFromFile(projectRoot);
  const value = toCliConfig(config);
  cached = { projectRoot, value };
  return value;
}

function toCliConfig(config: NormalizedYapyakConfig): YapyakCliConfig {
  return {
    defaultLocale: config.defaultLocale,
    localesDir: config.localesDir,
    translator: config.translator,
  };
}
