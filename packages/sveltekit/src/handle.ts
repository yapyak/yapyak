import type { Handle } from '@sveltejs/kit';

import { getPendingResponseHeaders, withRequest } from '@yapyak/adapter';
import { getLocale } from 'yapyak';

const PLACEHOLDER = '%yapyak.lang%';

/**
 * Handle for SvelteKit. Provides yapyak's per-request locale context.
 *
 * @remarks
 * Substitutes the `%yapyak.lang%` placeholder in `app.html` with the resolved locale on each request. Drains pending response headers buffered by yapyak (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing `Response`.
 *
 * @example Declare the placeholder in app.html
 * ```html
 * <html lang="%yapyak.lang%">
 * ```
 *
 * @example Re-export from hooks.server.ts
 * ```ts
 * export { handle } from '@yapyak/sveltekit';
 * ```
 *
 * @example Compose with other handles
 * ```ts
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { handle as yapyakHandle } from '@yapyak/sveltekit';
 * import { handle as authHandle } from './auth';
 *
 * export const handle = sequence(yapyakHandle, authHandle);
 * ```
 */
export const handle: Handle = ({ event, resolve }) =>
  withRequest(event.request, async () => {
    const response = await resolve(event, {
      transformPageChunk: ({ html }) => html.replace(PLACEHOLDER, getLocale()),
    });
    for (const [name, value] of getPendingResponseHeaders()) {
      response.headers.append(name, value);
    }
    return response;
  });
