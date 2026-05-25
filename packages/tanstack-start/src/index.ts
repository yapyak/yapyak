/**
 * TanStack Start adapter for yapyak.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/tanstack-start
 * # or
 * pnpm add @yapyak/tanstack-start
 * ```
 *
 * @packageDocumentation
 */

import type { AnyRequestMiddleware } from '@tanstack/react-start';

import { createMiddleware } from '@tanstack/react-start';
import { withRequest } from '@yapyak/adapter';

/**
 * Middleware for TanStack Start. Provides yapyak's per-request locale context.
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
  ({ request, next }) => withRequest(request, () => next()),
);
