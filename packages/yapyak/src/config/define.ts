import type { YapyakConfig } from './type';

/**
 * Defines a typed yapyak configuration.
 *
 * @param config - The yapyak configuration.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   persistence: 'cookie'
 * });
 * ```
 */
export function defineConfig(config: YapyakConfig): YapyakConfig {
  return config;
}
