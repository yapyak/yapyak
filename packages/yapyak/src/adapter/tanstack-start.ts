/**
 * TanStack Start adapter. Provides {@link middleware} for per-request locale context.
 *
 * @packageDocumentation
 */

import type { AnyRequestMiddleware } from '@tanstack/react-start';

import { createMiddleware } from '@tanstack/react-start';

import { withRequest } from '.';

/**
 * TanStack Start request middleware. Wires yapyak's per-request locale context.
 *
 * @example Register in `src/start.ts`
 * ```ts
 * import { middleware } from 'yapyak/adapter/tanstack-start';
 *
 * export default {
 *   requestMiddleware: [middleware],
 * };
 * ```
 */
export const middleware: AnyRequestMiddleware = createMiddleware().server(
  ({ request, next }) => withRequest(request, () => next()),
);
