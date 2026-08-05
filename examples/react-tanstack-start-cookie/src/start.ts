import { createCsrfMiddleware, createStart } from '@tanstack/react-start';
import { middleware } from '@yapyak/tanstack-start';

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    csrfMiddleware,
    middleware,
  ],
}));
