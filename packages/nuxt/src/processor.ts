import type { Processor } from 'yapyak/processor';

import { vue } from '@yapyak/vue/processor';
import { vanillaProcessor } from 'yapyak/processor/internal';

/** Options for {@link nuxt}. */
export type NuxtOptions = {
  /**
   * Whether files bind yapyak's `t` through explicit imports only.
   *
   * @remarks
   * Off, an unbound `t` in any processed file binds to yapyak, matching Nuxt's auto-imports. Turn it on when another global `t` exists in the project.
   *
   * @defaultValue `false`
   */
  explicitImports?: boolean;
};

/**
 * Creates the Nuxt processors for yapyak's compiler.
 *
 * @param options - The options.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { nuxt } from '@yapyak/nuxt/processor';
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   processors: [nuxt()]
 * });
 * ```
 */
export function nuxt(options: NuxtOptions = {}): Processor[] {
  const processors = [
    vue(),
    vanillaProcessor,
  ];
  if (options.explicitImports === true) {
    return processors;
  }
  return processors.map((processor) => ({
    ...processor,
    ambientBindings: [
      't',
    ],
  }));
}
