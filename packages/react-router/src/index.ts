/**
 * React Router adapter for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/react-router
 * # or
 * pnpm add @yapyak/react-router
 * ```
 *
 * @packageDocumentation
 */

import type { MiddlewareFunction } from 'react-router';

import { withRequest } from '@yapyak/adapter';

/**
 * Middleware for React Router. Provides yapyak's per-request locale context.
 *
 * @remarks
 * Requires `future.v8_middleware: true` in `react-router.config.ts`.
 *
 * @example Register in app/root.tsx
 * ```tsx
 * import type { Route } from './+types/root';
 * import { middleware as yapyakMiddleware } from '@yapyak/react-router';
 *
 * export const middleware: Route.MiddlewareFunction[] = [yapyakMiddleware];
 * ```
 */
export const middleware: MiddlewareFunction = ({ request }, next) =>
  withRequest(request, () => next());
