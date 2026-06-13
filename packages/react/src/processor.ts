import type { Fragment, Processor } from 'yapyak/processor';

import { createProcessor } from 'yapyak/processor';

/**
 * Creates a React processor for yapyak's compiler.
 *
 * @remarks
 * Handles `.tsx` and `.jsx` files. Declares `@yapyak/react` as the runtime binding so the dev transform side-effect-imports it for HMR wiring and so the transform injects the `useYapyak()` hook into React function components.
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
  return createProcessor(
    (magicString, source, importStatement) => {
      void source;
      magicString.prepend(`${importStatement}\n`);
    },
    [
      '.tsx',
      '.jsx',
    ],
    'react',
    parseFragments,
    '@yapyak/react',
  );
}

function parseFragments(source: string): Fragment[] {
  return [
    {
      code: source,
      kind: 'script',
      lang: 'ts',
      originalOffset: 0,
    },
  ];
}
