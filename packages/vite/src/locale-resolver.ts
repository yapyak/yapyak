import type {
  DiscoverLocalesResult,
  LocaleContext,
  LocaleData,
} from 'yapyak/compiler';

import { discoverLocales, readLocaleData } from 'yapyak/compiler';

interface EmittedLocales {
  defaultLocale: string;
  locales: string[];
}

export interface CreateLocaleResolverOptions {
  fixedLocale?: string;
}

export interface LocaleResolver {
  getDiscovery(): DiscoverLocalesResult;
  getEmittedLocales(): EmittedLocales;
  getLocaleData(): LocaleData;
  getProjectLocales(): EmittedLocales;
  invalidateData(): void;
  invalidateStructure(): void;
}

export function createLocaleResolver(
  context: Pick<LocaleContext, 'defaultLocale' | 'localesDir'>,
  projectRoot: string,
  options?: CreateLocaleResolverOptions,
): LocaleResolver {
  const fixedLocale = options?.fixedLocale;
  let discovery: DiscoverLocalesResult | null = null;
  let emitted: EmittedLocales | null = null;
  let localeData: LocaleData | null = null;

  function getDiscovery(): DiscoverLocalesResult {
    if (discovery === null) {
      discovery = discoverLocales(context.localesDir, projectRoot, {
        defaultLocale: context.defaultLocale,
      });
    }
    return discovery;
  }

  function getProjectLocales(): EmittedLocales {
    const result = getDiscovery();
    return { defaultLocale: result.defaultLocale, locales: result.locales };
  }

  function getEmittedLocales(): EmittedLocales {
    if (emitted === null) {
      const project = getProjectLocales();
      emitted =
        fixedLocale !== undefined
          ? {
              defaultLocale: project.defaultLocale,
              locales: [fixedLocale],
            }
          : project;
    }
    return emitted;
  }

  function getLocaleData(): LocaleData {
    if (localeData === null) {
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
      localeData = null;
    },
    invalidateStructure(): void {
      discovery = null;
      emitted = null;
      localeData = null;
    },
  };
}
