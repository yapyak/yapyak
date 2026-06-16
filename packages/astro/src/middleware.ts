import type { MiddlewareHandler } from 'astro';

import { withResponse } from 'yapyak/adapter';

export const middleware: MiddlewareHandler = (context, next) =>
  withResponse(context.request, () => next());
