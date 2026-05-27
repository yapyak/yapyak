import { setRequestReader, setResponseHeaderWriter } from 'yapyak/internal';

import { AsyncLocalStorage } from 'node:async_hooks';

const requestStorage = new AsyncLocalStorage<Request>();
const headersStorage = new AsyncLocalStorage<Headers>();

setRequestReader(() => requestStorage.getStore());
setResponseHeaderWriter((name, value) => {
  const headers = headersStorage.getStore();
  headers?.append(name, value);
});

/**
 * Runs `fn` with `request` bound to async-scoped storage.
 *
 * @remarks
 * Called by the shipped framework adapter packages. Called directly only when wiring a custom SSR setup. Establishes a fresh pending-response-headers buffer for the scope; framework adapters drain it via {@link getPendingResponseHeaders} after the inner pipeline returns its `Response`.
 *
 * @param request - The incoming Web `Request`.
 * @param fn - The function to run with the request bound.
 *
 * @example Bind the request in a custom handler
 * ```ts
 * import { getPendingResponseHeaders, withRequest } from '@yapyak/adapter';
 *
 * async function handler(request: Request): Promise<Response> {
 *   return withRequest(request, async () => {
 *     const response = await renderApp(request);
 *     for (const [name, value] of getPendingResponseHeaders()) {
 *       response.headers.append(name, value);
 *     }
 *     return response;
 *   });
 * }
 * ```
 */
export function withRequest<T>(request: Request, fn: () => T): T {
  return requestStorage.run(request, () => headersStorage.run(new Headers(), fn));
}

/**
 * Returns the pending response headers buffered during the current `withRequest` scope.
 *
 * @remarks
 * Called by the shipped framework adapter packages after the inner pipeline returns its `Response`, to merge yapyak-emitted headers (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing response. Returns an empty `Headers` instance when called outside a {@link withRequest} scope.
 *
 * @example Drain pending headers onto an Astro response
 * ```ts
 * import { defineMiddleware } from 'astro:middleware';
 * import { getPendingResponseHeaders, withRequest } from '@yapyak/adapter';
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
  return headersStorage.getStore() ?? new Headers();
}
