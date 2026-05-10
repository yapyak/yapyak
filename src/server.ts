import { AsyncLocalStorage } from 'node:async_hooks';
import { detectLocale } from './locale/detect.js';
import { parseCookie } from './parse-cookie.js';

export interface RequestContext {
  acceptLanguage?: string | undefined;
  cookieHeader?: string | undefined;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function withRequest<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export interface ResolveOptions {
  cookieName?: string;
  defaultLocale: string;
  locales: string[];
}

export function resolveRequestLocale(options: ResolveOptions): string {
  const context = getRequestContext();
  if (context === undefined) {
    return options.defaultLocale;
  }
  const persisted = readCookieValue(
    context.cookieHeader,
    options.cookieName ?? 'locale',
  );
  return detectLocale({
    acceptLanguage: context.acceptLanguage,
    defaultLocale: options.defaultLocale,
    locales: options.locales,
    persisted,
  });
}

function readCookieValue(
  header: string | undefined,
  name: string,
): string | undefined {
  if (header === undefined || header === '') {
    return undefined;
  }
  const cookies = parseCookie(header);
  const value = cookies[name];
  return value === '' ? undefined : value;
}
