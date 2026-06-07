import type { DiscoverLocalesResult, LocaleData } from 'yapyak/compiler';

import { discoverLocales, readLocaleData } from 'yapyak/compiler';

interface EmittedLocales {
  defaultLocale: string;
  locales: string[];
}

export interface CreateLocaleResolverOptions {
  defaultLocale: string;
  fixedLocale: string | undefined;
  localesDir: string;
  projectRoot: string;
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
  options: CreateLocaleResolverOptions,
): LocaleResolver {
  let discovery: DiscoverLocalesResult | null = null;
  let emitted: EmittedLocales | null = null;
  let localeData: LocaleData | null = null;

  function getDiscovery(): DiscoverLocalesResult {
    if (discovery === null) {
      discovery = discoverLocales({
        defaultLocale: options.defaultLocale,
        localesDir: options.localesDir,
        projectRoot: options.projectRoot,
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
        options.fixedLocale !== undefined
          ? {
              defaultLocale: project.defaultLocale,
              locales: [options.fixedLocale],
            }
          : project;
    }
    return emitted;
  }

  function getLocaleData(): LocaleData {
    if (localeData === null) {
      localeData = readLocaleData({
        locales: getEmittedLocales().locales,
        localesDir: options.localesDir,
        projectRoot: options.projectRoot,
      });
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
