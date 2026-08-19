import type { ExtractedMessage, LocaleData } from 'yapyak/compiler/internal';
import type { CompilerModule } from '../project';

export type TranslationStat = {
  locale: string;
  missing: number;
  translated: number;
};

export type BuildTranslationStatsInput = {
  defaultLocale: string;
  fileId?: string;
  localeData: LocaleData;
  locales: string[];
  messages: ExtractedMessage[];
};

export function buildTranslationStats(
  compiler: Pick<CompilerModule, 'findTranslation'>,
  input: BuildTranslationStatsInput,
): TranslationStat[] {
  const stats: TranslationStat[] = [];
  for (const locale of input.locales) {
    if (locale === input.defaultLocale) {
      continue;
    }
    let missing = 0;
    let translated = 0;
    for (const message of input.messages) {
      for (const location of message.locations) {
        if (input.fileId !== undefined && location.fileId !== input.fileId) {
          continue;
        }
        const value = compiler.findTranslation(
          input.localeData[locale]?.[location.fileId]?.[message.source],
          message.context,
        );
        if (value === undefined || value.trim() === '') {
          missing += 1;
        } else {
          translated += 1;
        }
      }
    }
    stats.push({
      locale,
      missing,
      translated,
    });
  }
  return stats;
}
