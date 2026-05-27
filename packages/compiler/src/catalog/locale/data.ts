import { readLocaleFile } from './file';
import { join } from 'node:path';

export interface LocaleData {
  [locale: string]: {
    [fileId: string]: { [source: string]: string };
  };
}

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
