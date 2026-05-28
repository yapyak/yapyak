import type { MiddlewareHandler } from 'astro';

import { getPendingResponseHeaders, withRequest } from '@yapyak/adapter';

/**
 * Middleware entrypoint injected by the yapyak Astro integration.
 *
 * @remarks
 * Auto-registered by {@link yapyak} via Astro's `addMiddleware`. Binds the per-request locale context and drains pending response headers buffered by yapyak (e.g. `Set-Cookie` from a server-side `setLocale()` call) onto the outgoing `Response`. Not imported directly — the integration wires it.
 */
export const onRequest: MiddlewareHandler = (context, next) =>
  withRequest(context.request, async () => {
    const response = await next();
    for (const [name, value] of getPendingResponseHeaders()) {
      response.headers.append(name, value);
    }
    return response;
  });
