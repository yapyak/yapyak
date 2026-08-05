import type { FilterPattern } from '../config';
import type { NormalizedYapyakConfig } from '../config/internal';
import type { Processor } from '../processor';
import type { Translator } from '../translator';

import { loadYapyakConfig } from '../config/internal';

export type Config = {
  defaultLocale: string;
  examples: number;
  exclude: FilterPattern;
  include: FilterPattern;
  localesDir: string;
  processors: Processor[];
  translator: Translator | undefined;
};

let cached:
  | {
      projectRoot: string;
      value: Config;
    }
  | undefined;

export async function loadConfig(projectRoot: string): Promise<Config> {
  if (cached?.projectRoot === projectRoot) {
    return cached.value;
  }
  const { config } = await loadYapyakConfig(projectRoot);
  const value = toCliConfig(config);
  cached = {
    projectRoot,
    value,
  };
  return value;
}

export function resetConfigCache(): void {
  cached = undefined;
}

function toCliConfig(config: NormalizedYapyakConfig): Config {
  return {
    defaultLocale: config.defaultLocale,
    examples: config.examples,
    exclude: config.exclude,
    include: config.include,
    localesDir: config.localesDir,
    processors: config.processors,
    translator: config.translator,
  };
}
