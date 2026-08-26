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
  /**
   * The directory `yapyak.config.ts`, the locales directory, and file ids resolve from.
   *
   * @remarks
   * Defaults to Vite's `root`. Set it when the bundler roots Vite somewhere else than the project — a meta-framework pointing Vite at its source directory.
   */
  root?: string;
};

/**
 * Creates the yapyak Vite plugin.
 *
 * @remarks
 * Configuration is read from `yapyak.config.{ts,mts,mjs,js}` in the project root.
 *
 * @param options - The options.
 *
 * @example
 * ```ts [vite.config.ts]
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak()]
 * });
 * ```
 *
 * @example Lock the build to a single locale
 * ```ts [vite.config.ts]
 * import { yapyak } from '@yapyak/vite';
 * import { defineConfig } from 'vite';
 *
 * export default defineConfig({
 *   plugins: [yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })]
 * });
 * ```
 */
export function yapyak(options: YapyakOptions = {}): Plugin[] {
  const state = createState({
    fixedLocale: options.fixedLocale,
    ...(options.root !== undefined && {
      root: options.root,
    }),
  });
  return [
    createConfigPlugin(state),
    createVirtualModulePlugin(state),
    createScanPlugin(state),
    createTransformPlugin(state),
    createDevServerPlugin(state),
  ];
}
