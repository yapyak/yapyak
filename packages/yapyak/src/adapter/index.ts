import type { RequestContext } from '../locale/index.ts';

import {
  loadLocaleData,
  registerRequestContextReader,
  resolveLocaleFromHeaders,
} from '../locale/index.ts';
import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<RequestContext>();

registerRequestContextReader(() => storage.getStore());

/**
 * Runs `fn` with the request's locale context bound to async-scoped storage.
 *
 * Resolves the locale from cookie + `Accept-Language`, loads its translations,
 * and binds everything for the duration of `fn`. The shipped adapters
 * (`yapyak/adapter/sveltekit`, `yapyak/adapter/tanstack-start`,
 * `yapyak/adapter/astro`, `yapyak/adapter/react-router`) call this for you.
 * Use it directly when wiring a custom SSR setup.
 *
 * @param request - The incoming Web `Request`.
 * @param fn - The function to run with the request bound. May return a promise.
 * @returns A promise resolving to the value returned by `fn`.
 *
 * @example
 * ```ts
 * import { withRequest } from 'yapyak/adapter';
 *
 * async function handler(request: Request): Promise<Response> {
 *   return withRequest(request, () => renderApp(request));
 * }
 * ```
 */
export async function withRequest<T>(
  request: Request,
  fn: () => T | Promise<T>,
): Promise<T> {
  const acceptLanguage = request.headers.get('accept-language') ?? undefined;
  const cookieHeader = request.headers.get('cookie') ?? undefined;
  const locale = resolveLocaleFromHeaders(acceptLanguage, cookieHeader);
  await loadLocaleData(locale);
  return storage.run({ acceptLanguage, cookieHeader, locale }, fn);
}
