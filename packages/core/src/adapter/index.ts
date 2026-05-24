/**
 * Custom adapter API. Provides {@link withRequest} for binding per-request locale context to async-scoped storage.
 *
 * @packageDocumentation
 */

import type { RequestHeaders } from '../locale';

import { registerRequestHeadersReader } from '../locale';
import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<RequestHeaders>();

registerRequestHeadersReader(() => storage.getStore());

/**
 * Runs `fn` with the request's locale headers bound to async-scoped storage.
 *
 * @remarks
 * Called by the shipped adapters (`yapyak/adapter/sveltekit`, `yapyak/adapter/tanstack-start`, `yapyak/adapter/astro`, `yapyak/adapter/react-router`). Called directly only when wiring a custom SSR setup.
 *
 * @param request - The incoming Web `Request`.
 * @param fn - The function to run with the request bound.
 *
 * @example
 * ```ts
 * import { withRequest } from '@yapyak/core';
 *
 * function handler(request: Request): Response {
 *   return withRequest(request, () => renderApp(request));
 * }
 * ```
 */
export function withRequest<T>(request: Request, fn: () => T): T {
  return storage.run(
    {
      acceptLanguage: request.headers.get('accept-language') ?? undefined,
      cookieHeader: request.headers.get('cookie') ?? undefined,
    },
    fn,
  );
}
