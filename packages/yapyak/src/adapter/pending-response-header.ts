import { getStorage } from './storage';

/**
 * Returns the pending response headers buffered during the current `withRequest` scope.
 *
 * @remarks
 * Called by the shipped framework adapter packages after the inner pipeline returns its `Response`, to merge yapyak-emitted headers (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing response. Returns an empty `Headers` instance when called outside a {@link withRequest} scope.
 *
 * @example Drain pending headers onto an Astro response
 * ```ts
 * import { defineMiddleware } from 'astro:middleware';
 * import { getPendingResponseHeaders, withRequest } from 'yapyak/adapter';
 *
 * export const onRequest = defineMiddleware(async (context, next) =>
 *   withRequest(context.request, async () => {
 *     const response = await next();
 *     for (const [name, value] of getPendingResponseHeaders()) {
 *       response.headers.append(name, value);
 *     }
 *     return response;
 *   }),
 * );
 * ```
 */
export function getPendingResponseHeaders(): Headers {
  return getStorage()?.headers.getStore() ?? new Headers();
}
