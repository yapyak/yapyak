import type { Handle } from '@sveltejs/kit';
import { config } from 'yapyak/internal/config';
import { parseCookie } from '../parse-cookie.js';

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

export interface HtmlLangTransformOptions {
  cookieName?: string;
  defaultLocale?: string;
  placeholder?: string;
}

export function htmlLangTransform(
  options: HtmlLangTransformOptions = {},
): (chunk: { html: string }) => string {
  const {
    cookieName = config.cookieName,
    defaultLocale = config.defaultLocale,
    placeholder = config.placeholder,
  } = options;

  return ({ html }) => {
    let locale = defaultLocale;
    if (_getRequestEvent) {
      try {
        const cookieString =
          _getRequestEvent().request.headers.get('cookie') ?? '';
        const fromCookie = parseCookie(cookieString, cookieName);
        if (fromCookie) {
          locale = fromCookie;
        }
      } catch {
        // request context not available — fall back to default
      }
    }
    return html.replace(placeholder, locale);
  };
}

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, { transformPageChunk: htmlLangTransform() });
