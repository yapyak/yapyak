import type { Plugin } from 'vite';

import {
  createConfigPlugin,
  createDevServerPlugin,
  createScanPlugin,
  createState,
  createTransformPlugin,
  createVirtualModulePlugin,
} from './plugin/index';

/**
 * Options for {@link yapyak}.
 */
export type YapyakOptions = {
  /**
   * Locks the build to a single locale.
   *
   * @remarks
   * Must be one of the configured locales. Throws at config resolution if not.
   */
  fixedLocale?: string;
};

/**
 * Creates the yapyak Vite plugin.
 *
 * @remarks
 * Configuration is read from `yapyak.config.{ts,mts,mjs,js}` in the project root.
 *
 * @param options - The plugin options.
 *
 * @example
 * ```ts [vite.config.ts]
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak()],
 * });
 * ```
 *
 * @example Lock the build to a single locale
 * ```ts [vite.config.ts]
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })],
 * });
 * ```
 */
export function yapyak(options: YapyakOptions = {}): Plugin[] {
  const state = createState({
    fixedLocale: options.fixedLocale,
  });
  return [
    createConfigPlugin(state),
    createVirtualModulePlugin(state),
    createScanPlugin(state),
    createTransformPlugin(state),
    createDevServerPlugin(state),
  ];
}
