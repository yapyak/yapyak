export interface LocaleStoreOptions {
  defaultLocale: string;
  initialLocale?: string;
  locales: string[];
}

export interface LocaleStore {
  defaultLocale: string;
  get(): string;
  getSnapshot(): string;
  locales: string[];
  set(locale: string): void;
  subscribe(listener: () => void): () => void;
}

export function createLocaleStore(options: LocaleStoreOptions): LocaleStore {
  const listeners = new Set<() => void>();
  const initial =
    options.initialLocale && options.locales.includes(options.initialLocale)
      ? options.initialLocale
      : options.defaultLocale;
  let locale = initial;
  let version = 0;
  let snapshot = `${locale}#${version}`;

  return {
    defaultLocale: options.defaultLocale,
    locales: options.locales,
    get() {
      return locale;
    },
    getSnapshot() {
      return snapshot;
    },
    set(next) {
      if (!options.locales.includes(next)) {
        return;
      }
      if (next === locale) {
        return;
      }
      locale = next;
      version++;
      snapshot = `${locale}#${version}`;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

let activeStore: LocaleStore | null = null;

export function configureLocale(options: LocaleStoreOptions): LocaleStore {
  activeStore = createLocaleStore(options);
  return activeStore;
}

export function getLocaleStore(): LocaleStore {
  if (activeStore === null) {
    activeStore = createLocaleStore({
      defaultLocale: 'en',
      locales: ['en'],
    });
  }
  return activeStore;
}

export function resetLocaleStore(): void {
  activeStore = null;
}

export function getLocale(): string {
  return getLocaleStore().get();
}

export function setLocale(locale: string): void {
  getLocaleStore().set(locale);
}
