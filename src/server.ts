import { AsyncLocalStorage } from 'node:async_hooks';
import { detectLocale } from './locale/detect.js';
import { parseCookie } from './parse-cookie.js';

/** The per-request context yapyak reads on the server. */
export interface RequestContext {
  /** The `Accept-Language` header value. */
  acceptLanguage?: string | undefined;
  /** The `Cookie` header value. */
  cookieHeader?: string | undefined;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Runs `fn` with the request context bound for the duration of the call.
 *
 * Wire this once in your SSR entry. The framework adapters (`tanstackStart`,
 * `sveltekit`) do this for you — only call it directly for custom SSR setups.
 *
 * @param context - The request context, sourced from the incoming HTTP request.
 * @param fn - The function to run with the context bound.
 * @returns The return value of `fn`.
 *
 * @example
 * ```ts
 * export async function handler(request: Request): Promise<Response> {
 *   return withRequest(
 *     {
 *       acceptLanguage: request.headers.get('accept-language') ?? undefined,
 *       cookieHeader: request.headers.get('cookie') ?? undefined,
 *     },
 *     () => renderApp(request),
 *   );
 * }
 * ```
 */
export function withRequest<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

/** @internal */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export interface ResolveOptions {
  cookieName?: string;
  defaultLocale: string;
  locales: string[];
}

/** @internal */
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
