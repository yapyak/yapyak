import type {
  DiscoverLocalesResult,
  LocaleContext,
  LocaleData,
} from 'yapyak/compiler/internal';

import { discoverLocales, readLocaleData } from 'yapyak/compiler/internal';

type EmittedLocales = {
  defaultLocale: string;
  locales: string[];
};

export type CreateLocaleResolverOptions = {
  fixedLocale?: string;
};

export type LocaleResolver = {
  getDiscovery(): DiscoverLocalesResult;
  getEmittedLocales(): EmittedLocales;
  getLocaleData(): LocaleData;
  getProjectLocales(): EmittedLocales;
  invalidateData(): void;
  invalidateStructure(): void;
};

export function createLocaleResolver(
  context: Pick<LocaleContext, 'defaultLocale' | 'localesDir'>,
  projectRoot: string,
  options?: CreateLocaleResolverOptions,
): LocaleResolver {
  const fixedLocale = options?.fixedLocale;
  let discovery: DiscoverLocalesResult | undefined;
  let emitted: EmittedLocales | undefined;
  let localeData: LocaleData | undefined;

  function getDiscovery(): DiscoverLocalesResult {
    if (discovery === undefined) {
      discovery = discoverLocales(context.localesDir, projectRoot, {
        defaultLocale: context.defaultLocale,
      });
    }
    return discovery;
  }

  function getProjectLocales(): EmittedLocales {
    const result = getDiscovery();
    return {
      defaultLocale: result.defaultLocale,
      locales: result.locales,
    };
  }

  function getEmittedLocales(): EmittedLocales {
    if (emitted === undefined) {
      const project = getProjectLocales();
      emitted =
        fixedLocale === undefined
          ? project
          : {
              defaultLocale: fixedLocale,
              locales: [
                fixedLocale,
              ],
            };
    }
    return emitted;
  }

  function getLocaleData(): LocaleData {
    if (localeData === undefined) {
      localeData = readLocaleData(
        {
          locales: getEmittedLocales().locales,
          localesDir: context.localesDir,
        },
        projectRoot,
      );
    }
    return localeData;
  }

  return {
    getDiscovery,
    getEmittedLocales,
    getLocaleData,
    getProjectLocales,
    invalidateData(): void {
      localeData = undefined;
    },
    invalidateStructure(): void {
      discovery = undefined;
      emitted = undefined;
      localeData = undefined;
    },
  };
}
