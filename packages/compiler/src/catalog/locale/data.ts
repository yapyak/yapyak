import type { LocaleFile } from './file';

import { CorruptLocaleFileError, readLocaleFile } from './file';
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
    const path = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.json`,
    );
    try {
      data[locale] = readLocaleFile(path);
    } catch (error) {
      if (error instanceof CorruptLocaleFileError) {
        console.warn(error.message);
        data[locale] = {};
        continue;
      }
      throw error;
    }
  }
  return data;
}
