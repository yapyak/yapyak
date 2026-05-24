/**
 * Adapter API. Provides {@link withRequest} for binding per-request locale context to async-scoped storage.
 *
 * Used by the shipped framework adapter packages (`@yapyak/astro`, `@yapyak/sveltekit`, `@yapyak/tanstack-start`, `@yapyak/react-router`) and by custom SSR integrations.
 *
 * @packageDocumentation
 */

import type { RequestHeaders } from '@yapyak/core';

import { registerRequestHeadersReader } from '@yapyak/core';

import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<RequestHeaders>();

registerRequestHeadersReader(() => storage.getStore());

/**
 * Runs `fn` with the request's locale headers bound to async-scoped storage.
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
  return storage.run(
    {
      acceptLanguage: request.headers.get('accept-language') ?? undefined,
      cookieHeader: request.headers.get('cookie') ?? undefined,
      url: request.url,
    },
    fn,
  );
}
