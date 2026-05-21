/// <reference types="astro/client" />

/**
 * Astro adapter. Provides {@link middleware} for per-request locale context.
 *
 * @packageDocumentation
 */

import { defineMiddleware } from 'astro:middleware';
import { withRequest } from '.';

type AstroMiddleware = ReturnType<typeof defineMiddleware>;

/**
 * Astro middleware that wires yapyak's per-request locale context for every
 * incoming request.
 *
 * Re-export from `src/middleware.ts`:
 *
 * @example
 * ```ts
 * // src/middleware.ts
 * export { middleware as onRequest } from 'yapyak/adapter/astro';
 * ```
 *
 * Composing with other middlewares via `sequence`:
 *
 * @example
 * ```ts
 * // src/middleware.ts
 * import { sequence } from 'astro:middleware';
 * import { middleware as yapyakMiddleware } from 'yapyak/adapter/astro';
 * import { authMiddleware } from './auth';
 *
 * export const onRequest = sequence(yapyakMiddleware, authMiddleware);
 * ```
 */
export const middleware: AstroMiddleware = defineMiddleware((context, next) =>
  withRequest(context.request, () => next()),
);
