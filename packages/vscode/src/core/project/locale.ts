import type { LocaleData } from 'yapyak/compiler/internal';
import type { Project } from './resolve';

export type ReadProjectLocalesResult = {
  localeData: LocaleData;
  locales: string[];
  sourceLocale: string;
};

export function readProjectLocales(project: Project): ReadProjectLocalesResult {
  const { compiler, config, root } = project;
  const { locales, sourceLocale } = compiler.discoverLocales(
    config.localesDir,
    root,
    {
      defaultLocale: config.defaultLocale,
      sourceLocale: config.sourceLocale,
    },
  );
  return {
    localeData: compiler.readLocaleData(
      {
        locales,
        localesDir: config.localesDir,
      },
      root,
    ),
    locales,
    sourceLocale,
  };
}
