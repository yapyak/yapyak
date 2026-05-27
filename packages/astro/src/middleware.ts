/// <reference types="astro/client" />

import { getPendingResponseHeaders, withRequest } from '@yapyak/adapter';

import { defineMiddleware } from 'astro:middleware';

type AstroMiddleware = ReturnType<typeof defineMiddleware>;

/**
 * Middleware for Astro. Provides yapyak's per-request locale context.
 *
 * @remarks
 * Drains pending response headers buffered by yapyak (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing `Response`.
 *
 * @example Re-export from src/middleware.ts
 * ```ts
 * export { middleware as onRequest } from '@yapyak/astro';
 * ```
 *
 * @example Compose with other middlewares
 * ```ts
 * import { sequence } from 'astro:middleware';
 * import { middleware as yapyakMiddleware } from '@yapyak/astro';
 * import { middleware as authMiddleware } from './auth';
 *
 * export const onRequest = sequence(yapyakMiddleware, authMiddleware);
 * ```
 */
export const middleware: AstroMiddleware = defineMiddleware((context, next) =>
  withRequest(context.request, async () => {
    const response = await next();
    for (const [name, value] of getPendingResponseHeaders()) {
      response.headers.append(name, value);
    }
    return response;
  }),
);
