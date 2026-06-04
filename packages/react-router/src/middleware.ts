import type { MiddlewareFunction } from 'react-router';

import { getPendingResponseHeaders, withRequest } from 'yapyak/adapter';

/**
 * Middleware for React Router. Provides yapyak's per-request locale context.
 *
 * @remarks
 * Requires `future.v8_middleware: true` in `react-router.config.ts`. Drains pending response headers buffered by yapyak (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing `Response`.
 *
 * @example Register in app/root.tsx
 * ```tsx [app/root.tsx]
 * import type { Route } from './+types/root';
 * import { middleware as yapyakMiddleware } from '@yapyak/react-router';
 *
 * export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];
 * ```
 */
export const middleware: MiddlewareFunction = ({ request }, next) =>
  withRequest(request, async () => {
    const result = await next();
    if (result instanceof Response) {
      for (const [name, value] of getPendingResponseHeaders()) {
        result.headers.append(name, value);
      }
    }
    return result;
  });
