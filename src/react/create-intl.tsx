import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useSyncExternalStore,
} from 'react';
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

export interface IntlProviderProps {
  children: ReactNode;
}

export type Translate = <T extends string>(
  source: T,
  ...args: ExtractParams<T> extends Record<string, never>
    ? []
    : [params: ExtractParams<T>]
) => string;

export interface Intl {
  IntlProvider: (props: IntlProviderProps) => ReactElement;
  getLocale: () => string;
  setLocale: (locale: string) => Promise<void>;
  setLocaleSync: (locale: string, module: LocaleModule) => void;
  subscribe: (listener: () => void) => () => void;
  t: Translate;
  useLocale: () => readonly [string, (locale: string) => Promise<void>];
  useTranslation: () => Intl;
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

  const Context = createContext<Intl | null>(null);

  function IntlProvider(props: IntlProviderProps): ReactElement {
    const { children } = props;

    const currentLocale = useSyncExternalStore(
      runtime.subscribe,
      runtime.getLocale,
      runtime.getLocale,
    );

    return (
      <Context.Provider key={currentLocale} value={intl}>
        {children}
      </Context.Provider>
    );
  }

  function useLocale(): readonly [string, (locale: string) => Promise<void>] {
    const locale = useSyncExternalStore(
      runtime.subscribe,
      runtime.getLocale,
      runtime.getLocale,
    );
    return [locale, runtime.setLocale];
  }

  function useTranslation(): Intl {
    const value = useContext(Context);
    if (!value) {
      throw new Error('useTranslation must be used inside <IntlProvider>');
    }
    return value;
  }

  function translate(
    source: string,
    params?: Record<string, unknown>,
    fileId?: string,
  ): string {
    if (!fileId) {
      return source;
    }
    return runtime.translate(source, params, fileId);
  }

  const intl: Intl = {
    IntlProvider,
    getLocale: runtime.getLocale,
    setLocale: runtime.setLocale,
    setLocaleSync: runtime.setLocaleSync,
    subscribe: runtime.subscribe,
    t: translate as Translate,
    useLocale,
    useTranslation,
  };

  return intl;
}
