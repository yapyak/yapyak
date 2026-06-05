import type { LocaleIssue } from './code';

import { validateLocaleCode } from './code';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface DiscoverLocalesOptions {
  defaultLocale?: string;
  localesDir: string;
  projectRoot: string;
}

export interface LocaleWarning {
  code: string;
  issue: LocaleIssue;
  suggestion?: string;
}

export interface DiscoverLocalesResult {
  defaultLocale: string;
  locales: string[];
  warnings: LocaleWarning[];
}

export function discoverLocales(
  options: DiscoverLocalesOptions,
): DiscoverLocalesResult {
  const dir = join(options.projectRoot, options.localesDir);
  const fileLocales = existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
        .sort()
    : [];
  const defaultLocale = options.defaultLocale || 'en';
  const uniqueLocales = new Set<string>([defaultLocale, ...fileLocales]);
  const locales = [...uniqueLocales].sort();
  const warnings: LocaleWarning[] = [];
  for (const code of locales) {
    const result = validateLocaleCode(code);
    if (!result.valid && result.issue) {
      const warning: LocaleWarning = { code, issue: result.issue };
      if (result.suggestion !== undefined) {
        warning.suggestion = result.suggestion;
      }
      warnings.push(warning);
    }
  }
  return { defaultLocale, locales, warnings };
}
