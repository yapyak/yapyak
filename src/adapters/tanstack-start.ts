import { setRequestSource } from '../locale/store.js';

interface HeadersLike {
  get(name: string): string | null | undefined;
}

let _getRequestHeaders: (() => HeadersLike) | undefined;
if (import.meta.env?.SSR) {
  const server = await import('@tanstack/react-start/server' as string);
  _getRequestHeaders = (server as { getRequestHeaders: () => HeadersLike })
    .getRequestHeaders;
}

export function tanstackStart(): void {
  if (!_getRequestHeaders) {
    return;
  }
  const get = _getRequestHeaders;
  setRequestSource(() => {
    const headers = get();
    return {
      acceptLanguage: headers.get('accept-language') ?? undefined,
      cookieHeader: headers.get('cookie') ?? undefined,
    };
  });
}
