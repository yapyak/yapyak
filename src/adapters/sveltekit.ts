import { setRequestSource } from '../server.js';

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
  setRequestSource(() => get().request.headers);
}
