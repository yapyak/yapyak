/**
 * Adapter API. Provides {@link withRequest} for binding the incoming Request to async-scoped storage.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/adapter
 * # or
 * pnpm add @yapyak/adapter
 * ```
 *
 * @packageDocumentation
 */

import { setRequestReader } from '@yapyak/core/internal';

import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<Request>();

setRequestReader(() => storage.getStore());

/**
 * Runs `fn` with the incoming `Request` bound to async-scoped storage. Yapyak's persistence implementations read from this scope server-side via `getFromRequest`.
 *
 * @remarks
 * Called by the shipped framework adapter packages. Called directly only when wiring a custom SSR setup.
 *
 * @param request - The incoming Web `Request`.
 * @param fn - The function to run with the request bound.
 *
 * @example
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
