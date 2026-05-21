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
 * SvelteKit `Handle` hook. Binds yapyak's per-request locale context and substitutes `%yapyak.lang%` in `app.html` with the resolved locale.
 *
 * @example Re-export from hooks.server.ts
 * ```ts
 * export { handle } from 'yapyak/adapter/sveltekit';
 * ```
 *
 * @example Compose with other handles
 * ```ts
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { handle as yapyakHandle } from 'yapyak/adapter/sveltekit';
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
