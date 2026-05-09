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
  getSnapshot: () => string;
  setLocale: (locale: string) => Promise<void>;
  setLocaleSync: (locale: string, module: LocaleModule) => void;
  setPreviewLocale: (locale: string | null) => void;
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
  let previewLocale: string | null = null;
  let version = 0;
  let snapshot = `${defaultLocale}#0`;

  function notify(): void {
    version++;
    snapshot = `${clientLocale ?? defaultLocale}#${version}`;
    for (const listener of listeners) {
      listener();
    }
  }

  function getSnapshot(): string {
    return snapshot;
  }

  function getLocale(): string {
    if (previewLocale !== null) {
      return previewLocale;
    }
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

  function setPreviewLocale(locale: string | null): void {
    previewLocale = locale;
    if (isBrowser) {
      version++;
      snapshot = `${getLocale()}#${version}`;
      for (const listener of listeners) {
        listener();
      }
    }
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
    getSnapshot,
    setLocale,
    setLocaleSync,
    setPreviewLocale,
    subscribe,
    translate,
  };
}
