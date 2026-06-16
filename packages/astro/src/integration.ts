import type { AstroIntegration } from 'astro';

import { yapyak as yapyakVite } from '@yapyak/vite';

/**
 * Creates the yapyak integration for Astro.
 *
 * @remarks
 * Registers yapyak's Vite plugin and injects the per-request locale middleware. Pair with the `astro()` processor in `yapyak.config.ts` so `.astro` frontmatter and templates are parsed for `t()` calls.
 *
 * @example Register in astro.config.ts
 * ```ts [astro.config.ts]
 * import { yapyak } from '@yapyak/astro/integration';
 * import { defineConfig } from 'astro/config';
 *
 * export default defineConfig({
 *   integrations: [yapyak()],
 * });
 * ```
 *
 * @example Register the matching processor in yapyak.config.ts
 * ```ts [yapyak.config.ts]
 * import { astro } from '@yapyak/astro/processor';
 * import { defineConfig } from 'yapyak/config';
 *
 * export default defineConfig({
 *   processors: [astro()],
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
