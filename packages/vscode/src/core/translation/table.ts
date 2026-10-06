import type { LocaleData } from 'yapyak/compiler/internal';
import type { CompilerModule } from '../project';

export type TranslationItem = {
  locale: string;
  value?: string;
};

export type BuildTranslationTableInput = {
  context?: string;
  fileId: string;
  localeData: LocaleData;
  locales: string[];
  source: string;
  sourceLocale: string;
};

export function buildTranslationTable(
  compiler: Pick<CompilerModule, 'findTranslation'>,
  input: BuildTranslationTableInput,
): TranslationItem[] {
  const { context, fileId, localeData, locales, source, sourceLocale } = input;
  const targetLocales = locales
    .filter((locale) => locale !== sourceLocale)
    .sort();
  return targetLocales.map((locale) => {
    const value = compiler.findTranslation(
      localeData[locale]?.[fileId]?.[source],
      context,
    );
    return value === undefined || value.trim() === ''
      ? {
          locale,
        }
      : {
          locale,
          value,
        };
  });
}
