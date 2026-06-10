import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    defaultPreload: 'intent',
    routeTree,
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
