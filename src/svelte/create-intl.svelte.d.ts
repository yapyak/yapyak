import type { ExtractParams, LocaleModule } from '../index.js';

export interface CreateIntlOptions {
  defaultLocale: string;
  detectLocale?: (() => string | undefined) | undefined;
  loader?: ((locale: string) => Promise<LocaleModule>) | undefined;
  locales: string[];
  messages?: Record<string, LocaleModule> | undefined;
}

export type Translate = <T extends string>(
  source: T,
  ...args: ExtractParams<T> extends Record<string, never>
    ? []
    : [params: ExtractParams<T>]
) => string;

export interface ReactiveLocale {
  current: string;
}

export interface Intl {
  getLocale: () => string;
  setLocale: (locale: string) => Promise<void>;
  setLocaleSync: (locale: string, module: LocaleModule) => void;
  setPreviewLocale: (locale: string | null) => void;
  subscribe: (listener: () => void) => () => void;
  locale: ReactiveLocale;
  t: Translate;
}

export declare function createIntl(options: CreateIntlOptions): Intl;
