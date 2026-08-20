import type { Handle } from '@sveltejs/kit';

import { getLocale, getTextDirection } from 'yapyak';
import { withResponse } from 'yapyak/adapter';

const LANG_PLACEHOLDER = '%yapyak.lang%';
const DIR_PLACEHOLDER = '%yapyak.dir%';

/**
 * Handle for SvelteKit. Provides yapyak's per-request locale context.
 *
 * @example
 * ```html [src/app.html]
 * <html lang="%yapyak.lang%" dir="%yapyak.dir%">
 * ```
 *
 * @example Re-export from hooks.server.ts
 * ```ts [src/hooks.server.ts]
 * export { handle } from '@yapyak/sveltekit';
 * ```
 *
 * @example Compose with other handles
 * ```ts [src/hooks.server.ts]
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { handle as yapyakHandle } from '@yapyak/sveltekit';
 * import { handle as authHandle } from './auth';
 *
 * export const handle = sequence(yapyakHandle, authHandle);
 * ```
 */
export const handle: Handle = ({ event, resolve }) =>
  withResponse(event.request, () =>
    resolve(event, {
      transformPageChunk: ({ html }) => {
        const locale = getLocale();
        return html
          .replaceAll(LANG_PLACEHOLDER, locale)
          .replaceAll(DIR_PLACEHOLDER, getTextDirection(locale));
      },
    }),
  );
