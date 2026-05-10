import type { Translator } from '../translators/types.js';

export type Framework = 'react' | 'vue' | 'svelte' | null;
export type Adapter = 'tanstackStart' | 'sveltekit' | null;
export type Persistence = 'cookie' | 'localStorage' | null;

export interface YapyakOptions {
  acceptLanguage?: boolean | undefined;
  adapter?: Adapter | undefined;
  cookieName?: string | undefined;
  defaultLocale: string;
  framework?: Framework | undefined;
  locales: string[];
  localesDir?: string | undefined;
  persistence?: Persistence | undefined;
  storageKey?: string | undefined;
  translator?: Translator | undefined;
}

export interface NormalizedOptions {
  acceptLanguage: boolean;
  adapter: Adapter;
  cookieName: string;
  defaultLocale: string;
  framework: Framework;
  locales: string[];
  localesDir: string;
  persistence: Persistence;
  storageKey: string;
  translator: Translator | undefined;
}

export function normalizeOptions(options: YapyakOptions): NormalizedOptions {
  if (typeof options.defaultLocale !== 'string' || options.defaultLocale === '') {
    throw new Error('yapyak: `defaultLocale` is required');
  }
  if (!Array.isArray(options.locales) || options.locales.length === 0) {
    throw new Error('yapyak: `locales` must be a non-empty array');
  }
  if (!options.locales.includes(options.defaultLocale)) {
    throw new Error(
      `yapyak: \`defaultLocale\` "${options.defaultLocale}" must be present in \`locales\``,
    );
  }
  for (const locale of options.locales) {
    if (typeof locale !== 'string' || locale === '') {
      throw new Error('yapyak: every entry in `locales` must be a non-empty string');
    }
  }

  return {
    acceptLanguage: options.acceptLanguage ?? false,
    adapter: options.adapter ?? null,
    cookieName: options.cookieName ?? 'locale',
    defaultLocale: options.defaultLocale,
    framework: options.framework ?? null,
    locales: [...options.locales],
    localesDir: options.localesDir ?? 'locales',
    persistence: options.persistence ?? null,
    storageKey: options.storageKey ?? 'yapyak:locale',
    translator: options.translator,
  };
}
