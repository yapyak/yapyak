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

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => {
      const locale = getLocaleStore().get();
      return html.replace(PLACEHOLDER, locale);
    },
  });
