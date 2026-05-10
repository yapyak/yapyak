import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface DiscoverOptions {
  defaultLocale?: string | undefined;
  localesDir: string;
  projectRoot: string;
}

export interface DiscoverResult {
  defaultLocale: string;
  locales: string[];
}

export function discoverLocales(options: DiscoverOptions): DiscoverResult {
  const dir = join(options.projectRoot, options.localesDir);
  if (!existsSync(dir)) {
    throw new Error(
      `yapyak: locales directory not found at ${dir}. Run yapyak init.`,
    );
  }
  const locales = readdirSync(dir)
    .filter((name) => name.endsWith('.yml'))
    .map((name) => name.replace(/\.yml$/, ''))
    .sort();
  if (locales.length === 0) {
    throw new Error(
      `yapyak: no locale files found in ${dir}. Run yapyak init.`,
    );
  }

  const requested = options.defaultLocale;
  if (requested !== undefined && requested !== '') {
    if (!locales.includes(requested)) {
      throw new Error(
        `yapyak: defaultLocale "${requested}" has no matching ${options.localesDir}/${requested}.yml`,
      );
    }
    return { defaultLocale: requested, locales };
  }

  if (locales.includes('en')) {
    return { defaultLocale: 'en', locales };
  }
  const first = locales[0];
  if (first === undefined) {
    throw new Error(`yapyak: no locale files found in ${dir}`);
  }
  return { defaultLocale: first, locales };
}
