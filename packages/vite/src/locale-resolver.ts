import type {
  DiscoverLocalesResult,
  LocaleData,
} from 'yapyak/compiler/internal';
import type { NormalizedYapyakConfig } from 'yapyak/config/internal';

import { discoverLocales, readLocaleData } from 'yapyak/compiler/internal';

type EmittedLocales = {
  defaultLocale: string;
  locales: string[];
};

type ProjectLocales = EmittedLocales & {
  sourceLocale: string;
};

export type CreateLocaleResolverOptions = {
  fixedLocale?: string;
};

export type LocaleResolver = {
  getDiscovery(): DiscoverLocalesResult;
  getEmittedLocales(): EmittedLocales;
  getLocaleData(): LocaleData;
  getProjectLocales(): ProjectLocales;
  invalidateData(): void;
  invalidateStructure(): void;
};

export function createLocaleResolver(
  config: Pick<
    NormalizedYapyakConfig,
    'defaultLocale' | 'localesDir' | 'sourceLocale'
  >,
  projectRoot: string,
  options?: CreateLocaleResolverOptions,
): LocaleResolver {
  const fixedLocale = options?.fixedLocale;
  let discovery: DiscoverLocalesResult | undefined;
  let emitted: EmittedLocales | undefined;
  let localeData: LocaleData | undefined;

  function getDiscovery(): DiscoverLocalesResult {
    if (discovery === undefined) {
      discovery = discoverLocales(config.localesDir, projectRoot, {
        defaultLocale: config.defaultLocale,
        sourceLocale: config.sourceLocale,
      });
    }
    return discovery;
  }

  function getProjectLocales(): ProjectLocales {
    const result = getDiscovery();
    return {
      defaultLocale: result.defaultLocale,
      locales: result.locales,
      sourceLocale: result.sourceLocale,
    };
  }

  function getEmittedLocales(): EmittedLocales {
    if (emitted === undefined) {
      const project = getProjectLocales();
      emitted =
        fixedLocale === undefined
          ? {
              defaultLocale: project.defaultLocale,
              locales: project.locales,
            }
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
          localesDir: config.localesDir,
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
