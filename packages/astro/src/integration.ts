import type { AstroIntegration } from 'astro';

import { yapyak as yapyakVite } from '@yapyak/vite';

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
};

/**
 * Creates the yapyak integration for Astro.
 *
 * @param options - The options.
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
 *
 * @example Lock the build to a single locale
 * ```ts [astro.config.ts]
 * import { yapyak } from '@yapyak/astro/integration';
 * import { defineConfig } from 'astro/config';
 *
 * export default defineConfig({
 *   integrations: [yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })]
 * });
 * ```
 */
export function yapyak(options: YapyakOptions = {}): AstroIntegration {
  return {
    hooks: {
      'astro:config:setup': ({ addMiddleware, updateConfig }) => {
        const plugins = yapyakVite({
          ...(options.fixedLocale !== undefined && {
            fixedLocale: options.fixedLocale,
          }),
        });
        updateConfig({
          vite: {
            // biome-ignore lint/suspicious/noExplicitAny: yap yap yap
            plugins: plugins as any,
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
