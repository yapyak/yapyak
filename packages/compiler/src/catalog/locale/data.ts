import type { LocaleFile } from './file';

import { readLocaleFile } from './file';
import { join } from 'node:path';

export type LocaleData = Record<string, LocaleFile>;

export interface ReadLocaleDataOptions {
  locales: string[];
  localesDir: string;
  projectRoot: string;
}

export function readLocaleData(options: ReadLocaleDataOptions): LocaleData {
  const data: LocaleData = {};
  for (const locale of options.locales) {
    data[locale] = readLocaleFile(
      join(options.projectRoot, options.localesDir, `${locale}.json`),
    );
  }
  return data;
}
