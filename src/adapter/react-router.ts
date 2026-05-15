import type { MiddlewareFunction } from 'react-router';

import { withRequest } from './index';

/**
 * React Router 7 framework-mode middleware that wires yapyak's per-request
 * locale context for every incoming request.
 *
 * Register in `app/root.tsx`:
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * import type { Route } from './+types/root';
 * import { middleware as yapyakMiddleware } from 'yapyak/adapter/react-router';
 *
 * export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];
 * ```
 *
 * Requires `future.v8_middleware: true` in `react-router.config.ts`.
 */
export const middleware: MiddlewareFunction = ({ request }, next) =>
  withRequest(request, () => next());
