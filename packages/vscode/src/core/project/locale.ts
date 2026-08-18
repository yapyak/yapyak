import type { LocaleData } from 'yapyak/compiler/internal';
import type { Project } from './resolve';

export type ReadProjectLocalesResult = {
  defaultLocale: string;
  localeData: LocaleData;
  locales: string[];
};

export function readProjectLocales(project: Project): ReadProjectLocalesResult {
  const { compiler, config, root } = project;
  const { defaultLocale, locales } = compiler.discoverLocales(
    config.localesDir,
    root,
    {
      defaultLocale: config.defaultLocale,
    },
  );
  return {
    defaultLocale,
    localeData: compiler.readLocaleData(
      {
        locales,
        localesDir: config.localesDir,
      },
      root,
    ),
    locales,
  };
}
