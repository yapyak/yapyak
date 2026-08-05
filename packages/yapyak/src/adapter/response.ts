import { createStorage } from './storage';

/**
 * Runs `handler` with `request` bound to per-request locale context.
 *
 * @param request - The incoming Web `Request`.
 * @param handler - Produces the response.
 *
 * @example
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
 * Runs `handler` with `request` bound to per-request locale context, extracting the `Response` from the handler's result.
 *
 * @param request - The incoming Web `Request`.
 * @param handler - Produces a result wrapping the response.
 * @param extractResponse - Locates the `Response` inside the result.
 *
 * @example
 * ```ts
 * import { withResponse } from 'yapyak/adapter';
 * import { createMiddleware } from '@tanstack/react-start';
 *
 * export const middleware = createMiddleware().server(({ next, request }) =>
 *   withResponse(request, () => next(), (result) => result.response)
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
          ? validateResponse(result)
          : extractResponse(result);
      mergePendingResponseHeaders(response.headers);
      return result;
    }),
  );
}

function validateResponse<T>(result: T): Response {
  if (result instanceof Response) {
    return result;
  }
  throw new TypeError(
    '[yapyak] withResponse: handler must return a Response. Pass extractResponse to extract a Response from a different result shape.',
  );
}

function mergePendingResponseHeaders(target: Headers): void {
  const buffer = createStorage().headers.getStore();
  if (buffer === undefined) {
    return;
  }
  for (const [name, value] of buffer) {
    target.append(name, value);
  }
}
