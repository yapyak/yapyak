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
export interface YapyakOptions {
  /**
   * Locks the build to a single locale. Stripped at compile time.
   *
   * @remarks
   * When set, eligible `t()` calls (with no `t.as(...)` context and only simple `{name}` placeholders) are rewritten to the matching translation literal for this locale and the `_pick` runtime is tree-shaken away. Calls that use `t.as(...)` or ICU patterns (plural, select, selectordinal, number, date, time) still emit a `_pick` runtime call so the runtime is preserved for those sites. Useful for static SPA deploys where each artifact serves one locale.
   *
   * Must be one of the locales configured in the project (i.e., a `<locale>.json` file under the locales directory). Throws at config-resolution time if not.
   *
   * Leave unset (or use `process.env.YAPYAK_LOCALE` for CI control) to keep the default multi-locale behavior where every call site emits a catalog of all available locales.
   *
   * @example Per-build static locale via CI
   * ```ts [vite.config.ts]
   * import { yapyak } from '@yapyak/vite';
   * import { defineConfig } from 'vite';
   *
   * export default defineConfig({
   *   plugins: [yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })],
   * });
   * ```
   */
  fixedLocale?: string;
}

/**
 * Creates the yapyak Vite plugin.
 *
 * @remarks
 * Configuration is read from `yapyak.config.{ts,mts,mjs,js}` in the project root. Returns defaults if no config file is found.
 *
 * Returned as five focused sub-plugins so Vite can list them individually for debugging: `yapyak:config`, `yapyak:virtual-module`, `yapyak:scan`, `yapyak:transform`, and `yapyak:dev-server`.
 *
 * @param options - The plugin options.
 *
 * @example Register in vite.config.ts
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
  const state = createState({ fixedLocale: options.fixedLocale });
  return [
    createConfigPlugin(state),
    createVirtualModulePlugin(state),
    createScanPlugin(state),
    createTransformPlugin(state),
    createDevServerPlugin(state),
  ];
}
