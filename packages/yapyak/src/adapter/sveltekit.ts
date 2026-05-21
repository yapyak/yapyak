/**
 * SvelteKit adapter. Provides the {@link handle} hook for per-request locale context and `<html lang>` substitution.
 *
 * @packageDocumentation
 */

import type { Handle } from '@sveltejs/kit';

import { getLocale } from '../locale';
import { withRequest } from '.';

const PLACEHOLDER = '%yapyak.lang%';

/**
 * SvelteKit `Handle` hook that binds yapyak's per-request locale context to
 * every incoming request and substitutes `%yapyak.lang%` in `app.html` with
 * the resolved locale.
 *
 * Re-export from your `hooks.server.ts`.
 *
 * @example
 * ```ts
 * // src/hooks.server.ts
 * export { handle } from 'yapyak/adapter/sveltekit';
 * ```
 */
export const handle: Handle = ({ event, resolve }) =>
  withRequest(event.request, () =>
    resolve(event, {
      transformPageChunk: ({ html }) => html.replace(PLACEHOLDER, getLocale()),
    }),
  );
