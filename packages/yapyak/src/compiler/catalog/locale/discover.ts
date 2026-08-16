import type { LocaleIssue } from './code';

import { validateLocaleCode } from './code';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type DiscoverLocalesOptions = {
  defaultLocale?: string;
};

export type LocaleWarning = {
  code: string;
  issue: LocaleIssue;
  suggestion?: string;
};

export type DiscoverLocalesResult = {
  defaultLocale: string;
  locales: string[];
  warnings: LocaleWarning[];
};

export function discoverLocales(
  localesDir: string,
  projectRoot: string,
  options?: DiscoverLocalesOptions,
): DiscoverLocalesResult {
  const directory = join(projectRoot, localesDir);
  const fileNames = existsSync(directory)
    ? readdirSync(directory, {
        withFileTypes: true,
      })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name.replace(/\.json$/, ''))
        .sort()
    : [];
  const fileLocales: string[] = [];
  const warnings: LocaleWarning[] = [];
  for (const code of fileNames) {
    const result = validateLocaleCode(code);
    if (result.valid) {
      fileLocales.push(code);
      continue;
    }
    if (result.issue === undefined) {
      continue;
    }
    const warning: LocaleWarning = {
      code,
      issue: result.issue,
    };
    if (result.suggestion !== undefined) {
      warning.suggestion = result.suggestion;
    }
    warnings.push(warning);
  }
  const defaultLocale = options?.defaultLocale || 'en';
  const uniqueLocales = new Set<string>([
    defaultLocale,
    ...fileLocales,
  ]);
  return {
    defaultLocale,
    locales: [
      ...uniqueLocales,
    ].sort(),
    warnings,
  };
}
