import type { MiddlewareHandler } from 'astro';

import { getPendingResponseHeaders, withRequest } from 'yapyak/adapter';

export const onRequest: MiddlewareHandler = (context, next) =>
  withRequest(context.request, async () => {
    const response = await next();
    for (const [name, value] of getPendingResponseHeaders()) {
      response.headers.append(name, value);
    }
    return response;
  });
