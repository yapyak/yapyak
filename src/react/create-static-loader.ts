import type { LocaleModule } from '../index.js';

export function createStaticLoader(
  modules: Record<string, LocaleModule>,
): (locale: string) => Promise<LocaleModule> {
  return async (locale) => {
    const module = modules[locale];
    if (!module) {
      throw new Error(`Unknown locale: ${locale}`);
    }
    return module;
  };
}
