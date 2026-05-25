/**
 * SvelteKit adapter. Provides the {@link handle} hook for per-request locale context and `<html lang>` substitution.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/sveltekit
 * # or
 * pnpm add @yapyak/sveltekit
 * ```
 *
 * ## Setup
 *
 * Re-export {@link handle} from `src/hooks.server.ts`.
 *
 * ```ts
 * export { handle } from '@yapyak/sveltekit';
 * ```
 *
 * @packageDocumentation
 */

import type { Handle } from '@sveltejs/kit';

import { withRequest } from '@yapyak/adapter';
import { getLocale } from '@yapyak/core';

const PLACEHOLDER = '%yapyak.lang%';

/**
 * SvelteKit `Handle` hook. Binds yapyak's per-request locale context and substitutes `%yapyak.lang%` in `app.html` with the resolved locale.
 *
 * @example Re-export from hooks.server.ts
 * ```ts
 * export { handle } from '@yapyak/sveltekit';
 * ```
 *
 * @example Compose with other handles
 * ```ts
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { handle as yapyakHandle } from '@yapyak/sveltekit';
 * import { handle as authHandle } from './auth';
 *
 * export const handle = sequence(yapyakHandle, authHandle);
 * ```
 */
export const handle: Handle = ({ event, resolve }) =>
  withRequest(event.request, () =>
    resolve(event, {
      transformPageChunk: ({ html }) => html.replace(PLACEHOLDER, getLocale()),
    }),
  );
