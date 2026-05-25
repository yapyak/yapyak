/// <reference types="astro/client" />

/**
 * Astro adapter. Provides {@link middleware} for per-request locale context.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/astro
 * # or
 * pnpm add @yapyak/astro
 * ```
 *
 * ## Setup
 *
 * Re-export {@link middleware} from `src/middleware.ts` as `onRequest`.
 *
 * ```ts
 * export { middleware as onRequest } from '@yapyak/astro';
 * ```
 *
 * @packageDocumentation
 */

import { withRequest } from '@yapyak/adapter';

import { defineMiddleware } from 'astro:middleware';

type AstroMiddleware = ReturnType<typeof defineMiddleware>;

/**
 * Astro middleware. Wires yapyak's per-request locale context.
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
  withRequest(context.request, () => next()),
);
