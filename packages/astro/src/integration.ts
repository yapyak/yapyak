import type { AstroIntegration } from 'astro';

import { yapyak as yapyakVitePlugin } from '@yapyak/vite';

/**
 * Creates the yapyak integration for Astro.
 *
 * @remarks
 * Registers yapyak's Vite plugin so `.astro` files are extracted and rewritten during compilation, and injects the per-request locale middleware. `t()` calls in `.astro` frontmatter and templates are translated at render time with no further wiring.
 *
 * @example Register in astro.config.ts
 * ```ts
 * import { yapyak } from '@yapyak/astro';
 * import { defineConfig } from 'astro/config';
 *
 * export default defineConfig({
 *   integrations: [yapyak()],
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
            plugins: [yapyakVitePlugin() as any],
            ssr: {
              noExternal: [/^@yapyak\//, 'yapyak'],
            },
          },
        });
        addMiddleware({
          entrypoint: '@yapyak/astro/middleware',
          order: 'pre',
        });
      },
    },
    name: '@yapyak/astro',
  };
}
