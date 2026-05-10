import type { Translator } from '../translators/types.js';

export type Persistence = 'cookie' | 'localStorage' | null;

export interface YapyakOptions {
  acceptLanguage?: boolean | undefined;
  cookieName?: string | undefined;
  defaultLocale?: string | undefined;
  localesDir?: string | undefined;
  persistence?: Persistence | undefined;
  storageKey?: string | undefined;
  translator?: Translator | undefined;
}

export interface NormalizedOptions {
  acceptLanguage: boolean;
  cookieName: string;
  defaultLocale: string | undefined;
  localesDir: string;
  persistence: Persistence;
  storageKey: string;
  translator: Translator | undefined;
}

export function normalizeOptions(options: YapyakOptions): NormalizedOptions {
  return {
    acceptLanguage: options.acceptLanguage ?? false,
    cookieName: options.cookieName ?? 'locale',
    defaultLocale: options.defaultLocale,
    localesDir: options.localesDir ?? 'locales',
    persistence: options.persistence ?? null,
    storageKey: options.storageKey ?? 'yapyak:locale',
    translator: options.translator,
  };
}
