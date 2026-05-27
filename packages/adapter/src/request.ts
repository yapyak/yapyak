import { setRequestReader } from 'yapyak/internal';

import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<Request>();

setRequestReader(() => storage.getStore());

/**
 * Runs `fn` with `request` bound to async-scoped storage.
 *
 * @remarks
 * Called by the shipped framework adapter packages. Called directly only when wiring a custom SSR setup.
 *
 * @param request - The incoming Web `Request`.
 * @param fn - The function to run with the request bound.
 *
 * @example Bind the request in a custom handler
 * ```ts
 * import { withRequest } from '@yapyak/adapter';
 *
 * function handler(request: Request): Response {
 *   return withRequest(request, () => renderApp(request));
 * }
 * ```
 */
export function withRequest<T>(request: Request, fn: () => T): T {
  return storage.run(request, fn);
}
