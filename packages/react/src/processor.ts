import type { Processor } from 'yapyak/processor';

import { createProcessor } from 'yapyak/processor';

const COMPONENT_NAME_RX = /^[A-Z]|^use[A-Z]/;

/** Options for {@link react}. */
export type ReactOptions = {
  /**
   * Whether to enable React Server Components mode.
   *
   * @remarks
   * When enabled, only files marked with `'use client'` re-render on locale changes.
   *
   * @defaultValue `false`
   */
  rsc?: boolean;
};

/**
 * Creates a React processor for yapyak's compiler.
 *
 * @param options - The options.
 *
 * @example
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { react } from '@yapyak/react/processor';
 *
 * export default defineConfig({
 *   processors: [react()]
 * });
 * ```
 *
 * @example With React Server Components
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { react } from '@yapyak/react/processor';
 *
 * export default defineConfig({
 *   processors: [react({ rsc: true })]
 * });
 * ```
 */
export function react(options: ReactOptions = {}): Processor {
  return createProcessor({
    extensions: [
      '.tsx',
      '.jsx',
    ],
    id: 'react',
    runtime: {
      componentHook: {
        invoke: 'useYapyak',
        namePattern: COMPONENT_NAME_RX,
        ...(options.rsc === true && {
          eligibilityDirective: 'use client',
        }),
      },
      module: '@yapyak/react/internal',
    },
  });
}
