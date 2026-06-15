import type { AnyRequestMiddleware } from '@tanstack/react-start';

import { createMiddleware } from '@tanstack/react-start';
import { withResponse } from 'yapyak/adapter';

/**
 * Middleware for TanStack Start. Provides yapyak's per-request locale context.
 *
 * @remarks
 * Drains pending response headers buffered by yapyak (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing `Response`.
 *
 * @example Register in src/start.ts
 * ```ts [src/start.ts]
 * import { createStart } from '@tanstack/react-start';
 * import { middleware } from '@yapyak/tanstack-start';
 *
 * export const startInstance = createStart(() => ({
 *   requestMiddleware: [middleware],
 * }));
 * ```
 */
export const middleware: AnyRequestMiddleware = createMiddleware().server(
  ({ next, request }) =>
    withResponse(
      request,
      () => next(),
      (result) => result.response,
    ),
);
