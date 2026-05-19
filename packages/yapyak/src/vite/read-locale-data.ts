import type { LocaleData } from './transform-source';

import { readLocaleFile } from './sync-locale-files';
import { join } from 'node:path';

export interface ReadOptions {
  locales: string[];
  localesDir: string;
  projectRoot: string;
}

export function readLocaleData(options: ReadOptions): LocaleData {
  const data: LocaleData = {};
  for (const locale of options.locales) {
    data[locale] = readLocaleFile(
      join(options.projectRoot, options.localesDir, `${locale}.json`),
    );
  }
  return data;
}
