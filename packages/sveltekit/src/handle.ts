import type { Handle } from '@sveltejs/kit';

import { getLocale } from 'yapyak';
import { withResponse } from 'yapyak/adapter';

const PLACEHOLDER = '%yapyak.lang%';

/**
 * Handle for SvelteKit. Provides yapyak's per-request locale context.
 *
 * @example
 * ```html [src/app.html]
 * <html lang="%yapyak.lang%">
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
      transformPageChunk: ({ html }) =>
        html.replaceAll(PLACEHOLDER, getLocale()),
    }),
  );
