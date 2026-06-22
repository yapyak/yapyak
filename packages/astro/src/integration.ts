import type { AstroIntegration } from 'astro';

import { yapyak as yapyakVite } from '@yapyak/vite';

/**
 * Creates the yapyak integration for Astro.
 *
 * @example
 * ```ts [astro.config.ts]
 * import { yapyak } from '@yapyak/astro/integration';
 * import { defineConfig } from 'astro/config';
 *
 * export default defineConfig({
 *   integrations: [yapyak()]
 * });
 * ```
 *
 * @example Register the matching processor in yapyak.config.ts
 * ```ts [yapyak.config.ts]
 * import { astro } from '@yapyak/astro/processor';
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   processors: [astro()]
 * });
 * ```
 */
export function yapyak(): AstroIntegration {
  return {
    hooks: {
      'astro:config:setup': ({ addMiddleware, updateConfig }) => {
        updateConfig({
          vite: {
            // biome-ignore lint/suspicious/noExplicitAny: yap yap yap
            plugins: yapyakVite() as any,
          },
        });
        addMiddleware({
          entrypoint: '@yapyak/astro/internal',
          order: 'pre',
        });
      },
    },
    name: '@yapyak/astro',
  };
}
