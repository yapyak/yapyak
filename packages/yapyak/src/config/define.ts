import type { YapyakConfig } from './type';

/**
 * Defines a typed yapyak configuration.
 *
 * @remarks
 * Provides editor autocomplete and type-checking in `yapyak.config.ts` without an explicit annotation. Returns the config unchanged — equivalent to `config satisfies YapyakConfig`.
 *
 * @param config - The yapyak configuration.
 *
 * @example Define the config
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   persistence: 'cookie',
 * });
 * ```
 */
export function defineConfig(config: YapyakConfig): YapyakConfig {
  return config;
}
