import type { AnyRequestMiddleware } from '@tanstack/react-start';

import { createMiddleware } from '@tanstack/react-start';
import { getPendingResponseHeaders, withRequest } from '@yapyak/adapter';

/**
 * Middleware for TanStack Start. Provides yapyak's per-request locale context.
 *
 * @remarks
 * Drains pending response headers buffered by yapyak (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing `Response`.
 *
 * @example Register in src/start.ts
 * ```ts
 * import { middleware } from '@yapyak/tanstack-start';
 *
 * export default {
 *   requestMiddleware: [middleware],
 * };
 * ```
 */
export const middleware: AnyRequestMiddleware = createMiddleware().server(
  ({ next, request }) =>
    withRequest(request, async () => {
      const result = await next();
      for (const [name, value] of getPendingResponseHeaders()) {
        result.response.headers.append(name, value);
      }
      return result;
    }),
);
