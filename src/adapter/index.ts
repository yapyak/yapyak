import { AsyncLocalStorage } from 'node:async_hooks';
import { registerRequestHeadersReader } from '../locale/store.js';

interface RequestHeaders {
  acceptLanguage: string | undefined;
  cookieHeader: string | undefined;
}

const storage = new AsyncLocalStorage<RequestHeaders>();

registerRequestHeadersReader(() => storage.getStore());

/**
 * Runs `fn` with the request's locale headers bound to an async-scoped context.
 *
 * The shipped adapters (`yapyak/adapter/sveltekit`, `yapyak/adapter/tanstack-start`,
 * `yapyak/adapter/astro`, `yapyak/adapter/react-router`, `yapyak/adapter/nuxt`)
 * call this for you. Use it directly when wiring a custom SSR setup.
 *
 * @param request - The incoming Web `Request`.
 * @param fn - The function to run with the request bound.
 * @returns The return value of `fn`.
 *
 * @example
 * ```ts
 * import { withRequest } from 'yapyak/adapter';
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

/** @internal */
export function getRequestHeaders(): RequestHeaders | undefined {
  return storage.getStore();
}
