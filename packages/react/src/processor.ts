import type { Processor } from 'yapyak/processor';

import { createProcessor } from 'yapyak/processor';

const COMPONENT_NAME_RX = /^[A-Z]|^use[A-Z]/;

/** Options for the React processor. */
export type ReactOptions = {
  /**
   * Enable React Server Components mode.
   *
   * When `true`, only files whose prologue contains the `'use client'`
   * directive get the `useYapyak()` hook injection. Files without it
   * (server components) still get `t()` lookups rewritten, but no hook —
   * which would crash RSC at build time.
   *
   * Leave `false` (default) for vanilla React (Vite, CRA) where every
   * component is a client component and re-renders on locale change.
   */
  rsc?: boolean;
};

/**
 * Creates a React processor for yapyak's compiler.
 *
 * @remarks
 * Handles `.tsx` and `.jsx` files. Declares `@yapyak/react/internal` as the
 * runtime module so the dev transform side-effect-imports it for HMR wiring,
 * and configures the component hook so the compiler injects `useYapyak()` at
 * the top of every function component or custom hook that contains `t()`.
 *
 * Pass `rsc: true` for React Server Components — only files marked with
 * `'use client'` then receive the hook injection.
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
 *
 * @example With React Server Components
 * ```ts [yapyak.config.ts]
 * import { defineConfig } from 'yapyak/config';
 * import { react } from '@yapyak/react/processor';
 *
 * export default defineConfig({
 *   processors: [react({ rsc: true })],
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
