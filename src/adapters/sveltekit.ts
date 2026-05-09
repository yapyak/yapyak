import type { Handle } from '@sveltejs/kit';
import { config } from 'yapyak/internal/config';
import { parseCookie } from '../parse-cookie.js';

const PLACEHOLDER = '%lang%';

interface HeadersLike {
  get(name: string): string | null | undefined;
}

let _getRequestEvent: (() => { request: { headers: HeadersLike } }) | undefined;
if (import.meta.env?.SSR) {
  const server = await import('$app/server' as string);
  _getRequestEvent = (
    server as { getRequestEvent: () => { request: { headers: HeadersLike } } }
  ).getRequestEvent;
}

function transformPageChunk({ html }: { html: string }): string {
  let locale = config.defaultLocale;
  if (_getRequestEvent) {
    try {
      const cookieString =
        _getRequestEvent().request.headers.get('cookie') ?? '';
      const fromCookie = parseCookie(cookieString, config.cookieName);
      if (fromCookie) {
        locale = fromCookie;
      }
    } catch {
      // request context not available — fall back to default
    }
  }
  return html.replace(PLACEHOLDER, locale);
}

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, { transformPageChunk });
