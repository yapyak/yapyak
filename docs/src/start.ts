import { createStart } from '@tanstack/react-start';
import { middleware } from '@yapyak/tanstack-start';

export const startInstance = createStart(() => ({
  requestMiddleware: [
    middleware,
  ],
}));
