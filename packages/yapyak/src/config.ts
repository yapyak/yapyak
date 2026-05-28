import type { YapyakConfig } from '@yapyak/shared';

/**
 * Defines a typed yapyak configuration.
 *
 * @remarks
 * Provides editor autocomplete and type-checking in `yapyak.config.ts` without an explicit annotation. Returns the config unchanged — equivalent to `config satisfies YapyakConfig`.
 *
 * @param config - The yapyak configuration.
 *
 * @example Define the config
 * ```ts
 * import { defineConfig } from 'yapyak';
 *
 * export default defineConfig({
 *   persistence: 'cookie',
 * });
 * ```
 */
export function defineConfig(config: YapyakConfig): YapyakConfig {
  return config;
}
