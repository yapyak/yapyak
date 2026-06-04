import { install } from './storage';

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
 * import { getPendingResponseHeaders, withRequest } from 'yapyak/adapter';
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
  const { headers, requests } = install();
  return requests.run(request, () => headers.run(new Headers(), fn));
}
