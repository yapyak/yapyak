import type { LocaleData } from 'yapyak/compiler/internal';
import type { CompilerModule } from '../project';

export type TranslationItem = {
  locale: string;
  value?: string;
};

export type BuildTranslationTableInput = {
  context?: string;
  defaultLocale: string;
  fileId: string;
  localeData: LocaleData;
  locales: string[];
  source: string;
};

export function buildTranslationTable(
  compiler: Pick<CompilerModule, 'findTranslation'>,
  input: BuildTranslationTableInput,
): TranslationItem[] {
  const { context, defaultLocale, fileId, localeData, locales, source } = input;
  const targetLocales = locales
    .filter((locale) => locale !== defaultLocale)
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
