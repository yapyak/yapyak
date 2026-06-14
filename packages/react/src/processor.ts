import type { Processor } from 'yapyak/processor';

import { createProcessor } from 'yapyak/processor';

/**
 * Creates a React processor for yapyak's compiler.
 *
 * @remarks
 * Handles `.tsx` and `.jsx` files. Declares `@yapyak/react/internal` as the runtime module so the dev transform side-effect-imports it for HMR wiring and injects a `useYapyak()` hook call at the top of every React function component containing `t()`.
 *
 * @example Register in yapyak.config.ts
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { react } from '@yapyak/react/processor';
 *
 * export default defineConfig({
 *   processors: [react()],
 * });
 * ```
 */
export function react(): Processor {
  return createProcessor({
    extensions: [
      '.tsx',
      '.jsx',
    ],
    id: 'react',
    runtime: {
      invoke: 'useYapyak',
      module: '@yapyak/react/internal',
    },
  });
}
