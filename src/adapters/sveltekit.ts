import type { Handle } from '@sveltejs/kit';
import { getLocaleStore, setRequestSource } from '../locale/store.js';

interface HeadersLike {
  get(name: string): string | null | undefined;
}

let _getRequestEvent:
  | (() => { request: { headers: HeadersLike } })
  | undefined;
if (import.meta.env?.SSR) {
  const server = await import('$app/server' as string);
  _getRequestEvent = (
    server as { getRequestEvent: () => { request: { headers: HeadersLike } } }
  ).getRequestEvent;
}

/**
 * Wires yapyak to SvelteKit's per-request headers for SSR locale detection.
 *
 * Call once at the top of `hooks.server.ts`.
 *
 * @example
 * ```ts
 * import { sveltekit, handle } from 'yapyak/sveltekit';
 *
 * sveltekit();
 * export { handle };
 * ```
 */
export function sveltekit(): void {
  if (!_getRequestEvent) {
    return;
  }
  const get = _getRequestEvent;
  setRequestSource(() => {
    const headers = get().request.headers;
    return {
      acceptLanguage: headers.get('accept-language') ?? undefined,
      cookieHeader: headers.get('cookie') ?? undefined,
    };
  });
}

const PLACEHOLDER = '%yapyak.lang%';

/**
 * SvelteKit `Handle` hook that substitutes `%yapyak.lang%` in `app.html`
 * with the resolved locale.
 *
 * Re-export from your `hooks.server.ts`.
 */
export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => {
      const locale = getLocaleStore().get();
      return html.replace(PLACEHOLDER, locale);
    },
  });
