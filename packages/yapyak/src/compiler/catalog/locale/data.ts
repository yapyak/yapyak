import type { LocaleContext } from './context';
import type { LocaleFile } from './file';

import { warn } from '../../../warn';
import { CorruptLocaleFileError, readLocaleFile } from './file';
import { join } from 'node:path';

export type LocaleData = Record<string, LocaleFile>;

export function readLocaleData(
  context: Pick<LocaleContext, 'locales' | 'localesDir'>,
  projectRoot: string,
): LocaleData {
  const localeData: LocaleData = {};
  for (const locale of context.locales) {
    const path = join(projectRoot, context.localesDir, `${locale}.json`);
    try {
      localeData[locale] = readLocaleFile(path);
    } catch (error) {
      if (error instanceof CorruptLocaleFileError) {
        warn(error.message, {
          code: 'YPK_CORRUPT_LOCALE_FILE',
        });
        localeData[locale] = {};
        continue;
      }
      throw error;
    }
  }
  return localeData;
}
