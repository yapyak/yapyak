import { createStorage } from './storage';

/**
 * Runs `handler` with `request` bound to async-scoped storage, then drains pending response headers buffered during the scope onto the produced `Response`.
 *
 * @remarks
 * The single public entry point of `yapyak/adapter`. Use this form when the handler returns a `Response` directly (sveltekit, astro, react-router). Use the three-argument form with `extractResponse` when the handler returns a value that wraps the `Response` (tanstack-start).
 *
 * Pending headers come from server-side `setLocale()` calls and other yapyak-internal sources buffered by persistence. The buffer is established fresh per scope and never leaks between concurrent requests.
 *
 * @param request - The incoming Web `Request`.
 * @param handler - Produces the response. Runs inside the request-bound async scope.
 *
 * @example SvelteKit handle
 * ```ts
 * import { withResponse } from 'yapyak/adapter';
 *
 * export const handle: Handle = ({ event, resolve }) =>
 *   withResponse(event.request, () => resolve(event));
 * ```
 */
export function withResponse(
  request: Request,
  handler: () => Response | Promise<Response>,
): Promise<Response>;
/**
 * Runs `handler` with `request` bound to async-scoped storage, locates the produced `Response` via `extractResponse`, then drains pending response headers onto it before returning the handler's result.
 *
 * @remarks
 * Use this form when the handler returns a value that wraps the `Response` (e.g. TanStack Start's `{ response, ... }` middleware result). The handler's full result is returned; only the located `Response`'s headers are mutated.
 *
 * @param request - The incoming Web `Request`.
 * @param handler - Produces a result that wraps the response. Runs inside the request-bound async scope.
 * @param extractResponse - Locates the `Response` inside the handler's result.
 *
 * @example TanStack Start middleware
 * ```ts
 * import { withResponse } from 'yapyak/adapter';
 * import { createMiddleware } from '@tanstack/react-start';
 *
 * export const middleware = createMiddleware().server(({ next, request }) =>
 *   withResponse(request, () => next(), (result) => result.response),
 * );
 * ```
 */
export function withResponse<T>(
  request: Request,
  handler: () => T | Promise<T>,
  extractResponse: (result: T) => Response,
): Promise<T>;
export function withResponse<T>(
  request: Request,
  handler: () => T | Promise<T>,
  extractResponse?: (result: T) => Response,
): Promise<T> {
  const { headers, requests } = createStorage();
  return requests.run(request, () =>
    headers.run(new Headers(), async () => {
      const result = await handler();
      const response =
        extractResponse === undefined
          ? requireResponse(result)
          : extractResponse(result);
      drainPendingResponseHeaders(response.headers);
      return result;
    }),
  );
}

function requireResponse<T>(result: T): Response {
  if (result instanceof Response) {
    return result;
  }
  throw new TypeError(
    '[yapyak] withResponse: handler must return a Response. Pass extractResponse to extract a Response from a different result shape.',
  );
}

function drainPendingResponseHeaders(target: Headers): void {
  const buffer = createStorage().headers.getStore();
  if (buffer === undefined) {
    return;
  }
  for (const [name, value] of buffer) {
    target.append(name, value);
  }
}
