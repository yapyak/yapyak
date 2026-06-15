import type { MiddlewareHandler } from 'astro';

import { withResponse } from 'yapyak/adapter';

export const onRequest: MiddlewareHandler = (context, next) =>
  withResponse(context.request, () => next());
