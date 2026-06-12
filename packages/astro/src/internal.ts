import type { MiddlewareHandler } from 'astro';

import { mergePendingResponseHeaders, withRequest } from 'yapyak/adapter';

export const onRequest: MiddlewareHandler = (context, next) =>
  withRequest(context.request, async () => {
    const response = await next();
    mergePendingResponseHeaders(response.headers);
    return response;
  });
