import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface YapyakConfig {
  defaultLocale: string;
  factories: string[];
  intlModules: string[];
  locales: string[];
  localesDir: string;
  source: string[];
}

export const CACHE_CONFIG_PATH = 'node_modules/.cache/yapyak/config.json';

export function loadConfig(projectRoot: string): YapyakConfig {
  const configPath = join(projectRoot, CACHE_CONFIG_PATH);
  if (!existsSync(configPath)) {
    throw new Error(
      `No yapyak config cache found at ${configPath}. Start the Vite dev server (or run a build) once so the yapyak plugin can write its config.`,
    );
  }
  const raw = readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<YapyakConfig>;
  const defaultLocale = parsed.defaultLocale ?? 'en';
  return {
    defaultLocale,
    factories: parsed.factories ?? ['intl'],
    intlModules: parsed.intlModules ?? ['yapyak'],
    locales: parsed.locales ?? [defaultLocale],
    localesDir: parsed.localesDir ?? 'locales',
    source: parsed.source ?? ['src/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
  };
}
