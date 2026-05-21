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
 * Astro middleware. Wires yapyak's per-request locale context.
 *
 * @example Re-export from src/middleware.ts
 * ```ts
 * export { middleware as onRequest } from 'yapyak/adapter/astro';
 * ```
 *
 * @example Compose with other middlewares
 * ```ts
 * import { sequence } from 'astro:middleware';
 * import { middleware as yapyakMiddleware } from 'yapyak/adapter/astro';
 * import { middleware as authMiddleware } from './auth';
 *
 * export const onRequest = sequence(yapyakMiddleware, authMiddleware);
 * ```
 */
export const middleware: AstroMiddleware = defineMiddleware((context, next) =>
  withRequest(context.request, () => next()),
);
