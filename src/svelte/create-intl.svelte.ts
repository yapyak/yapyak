import {
  createRuntime,
  type ExtractParams,
  type LocaleModule,
} from '../index.js';

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
  locale: ReactiveLocale;
  t: Translate;
}

export function createIntl(options: CreateIntlOptions): Intl {
  const { defaultLocale, detectLocale, loader, locales, messages } = options;

  const runtime = createRuntime({
    defaultLocale,
    detectLocale,
    locales,
    loader: loader ?? (async () => ({})),
    messages,
  });

  let localeState = $state(runtime.getLocale());
  runtime.subscribe(() => {
    localeState = runtime.getLocale();
  });

  const locale: ReactiveLocale = {
    get current(): string {
      return localeState;
    },
    set current(next: string) {
      void runtime.setLocale(next);
    },
  };

  function translate(
    source: string,
    params?: Record<string, unknown>,
    fileId?: string,
  ): string {
    void localeState;
    if (!fileId) {
      return source;
    }
    return runtime.translate(source, params, fileId);
  }

  return {
    getLocale: runtime.getLocale,
    setLocale: runtime.setLocale,
    setLocaleSync: runtime.setLocaleSync,
    locale,
    t: translate as Translate,
  };
}
