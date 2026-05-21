/**
 * React Router 7 adapter. Provides {@link middleware} for per-request locale context.
 *
 * @packageDocumentation
 */

import type { MiddlewareFunction } from 'react-router';

import { withRequest } from '.';

/**
 * React Router 7 framework-mode middleware. Wires yapyak's per-request locale context.
 *
 * @remarks
 * Requires `future.v8_middleware: true` in `react-router.config.ts`.
 *
 * @example Register in app/root.tsx
 * ```tsx
 * import type { Route } from './+types/root';
 * import { middleware as yapyakMiddleware } from 'yapyak/adapter/react-router';
 *
 * export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];
 * ```
 */
export const middleware: MiddlewareFunction = ({ request }, next) =>
  withRequest(request, () => next());
