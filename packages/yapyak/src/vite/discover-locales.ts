import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface DiscoverOptions {
  defaultLocale?: string;
  localesDir: string;
  projectRoot: string;
}

export interface DiscoverResult {
  defaultLocale: string;
  locales: string[];
}

export function discoverLocales(options: DiscoverOptions): DiscoverResult {
  const dir = join(options.projectRoot, options.localesDir);
  const fileLocales = existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
        .sort()
    : [];
  const defaultLocale =
    options.defaultLocale !== undefined && options.defaultLocale !== ''
      ? options.defaultLocale
      : 'en';
  const set = new Set<string>([defaultLocale, ...fileLocales]);
  const locales = [...set].sort();
  return { defaultLocale, locales };
}
