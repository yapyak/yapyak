import { type App, onScopeDispose, type Ref, ref } from 'vue';
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

export interface YapyakPlugin {
  install: (app: App) => void;
  getLocale: () => string;
  setLocale: (locale: string) => Promise<void>;
  setLocaleSync: (locale: string, module: LocaleModule) => void;
  t: Translate;
  useLocale: () => Ref<string>;
}

export function createIntl(options: CreateIntlOptions): YapyakPlugin {
  const { defaultLocale, detectLocale, loader, locales, messages } = options;

  const runtime = createRuntime({
    defaultLocale,
    detectLocale,
    locales,
    loader: loader ?? (async () => ({})),
    messages,
  });

  const localeTracker = ref(runtime.getLocale());
  runtime.subscribe(() => {
    localeTracker.value = runtime.getLocale();
  });

  function useLocale(): Ref<string> {
    const localeRef = ref(runtime.getLocale());
    const unsub = runtime.subscribe(() => {
      localeRef.value = runtime.getLocale();
    });
    onScopeDispose(unsub);
    return localeRef;
  }

  function translate(
    source: string,
    params?: Record<string, unknown>,
    fileId?: string,
  ): string {
    void localeTracker.value;
    if (!fileId) {
      return source;
    }
    return runtime.translate(source, params, fileId);
  }

  return {
    install(_app: App) {
      // Reserved for future setup (devtools, global mixins, typed inject).
    },
    getLocale: runtime.getLocale,
    setLocale: runtime.setLocale,
    setLocaleSync: runtime.setLocaleSync,
    t: translate as Translate,
    useLocale,
  };
}
