import type { LocaleModule } from './types.js';

export interface RuntimeOptions {
  defaultLocale: string;
  detectLocale?: (() => string | undefined) | undefined;
  loader: (locale: string) => Promise<LocaleModule>;
  locales: string[];
  messages?: Record<string, LocaleModule> | undefined;
}

export interface Runtime {
  getLocale: () => string;
  getLocales: () => string[];
  setLocale: (locale: string) => Promise<void>;
  setLocaleSync: (locale: string, module: LocaleModule) => void;
  subscribe: (listener: () => void) => () => void;
  translate: (
    source: string,
    params: Record<string, unknown> | undefined,
    fileId: string,
  ) => string;
}

export function createRuntime(options: RuntimeOptions): Runtime {
  const { defaultLocale, detectLocale, loader, messages = {} } = options;
  const locales = options.locales;
  const listeners = new Set<() => void>();
  const isBrowser = typeof document !== 'undefined';
  const allMessages: Record<string, LocaleModule> = { ...messages };
  let clientLocale: string | undefined;
  let clientMessages: LocaleModule = messages[defaultLocale] ?? {};

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function getLocale(): string {
    if (!isBrowser) {
      return detectLocale?.() ?? defaultLocale;
    }
    if (clientLocale === undefined) {
      clientLocale = detectLocale?.() ?? defaultLocale;
      const detected = allMessages[clientLocale];
      if (detected) {
        clientMessages = detected;
      }
    }
    return clientLocale;
  }

  function getLocales(): string[] {
    return locales;
  }

  async function setLocale(locale: string): Promise<void> {
    const module = await loader(locale);
    allMessages[locale] = module;
    if (isBrowser) {
      clientLocale = locale;
      clientMessages = module;
      notify();
    }
  }

  function setLocaleSync(locale: string, module: LocaleModule): void {
    allMessages[locale] = module;
    if (isBrowser) {
      clientLocale = locale;
      clientMessages = module;
      notify();
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function translate(
    source: string,
    params: Record<string, unknown> | undefined,
    fileId: string,
  ): string {
    const activeMessages = isBrowser
      ? clientMessages
      : (allMessages[getLocale()] ?? {});
    const fileMessages = activeMessages[fileId];
    const fn = fileMessages?.[source];
    if (!fn) {
      return source;
    }
    return fn(params ?? {});
  }

  return {
    getLocale,
    getLocales,
    setLocale,
    setLocaleSync,
    subscribe,
    translate,
  };
}
