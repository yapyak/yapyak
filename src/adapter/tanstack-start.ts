import type { AnyRequestMiddleware } from '@tanstack/react-start';

import { createMiddleware } from '@tanstack/react-start';

import { withRequest } from './index.js';

/**
 * TanStack Start request middleware that wires yapyak's per-request locale
 * context for every incoming request.
 *
 * Register in `src/start.ts`:
 *
 * @example
 * ```ts
 * // src/start.ts
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
