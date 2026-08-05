import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    defaultHashScrollIntoView: {
      block: 'start',
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: Number.POSITIVE_INFINITY,
    defaultStaleTime: Number.POSITIVE_INFINITY,
    routeTree,
    scrollRestoration: false,
  });
}

declare module '@tanstack/react-router' {
  // biome-ignore-start lint/style/useConsistentTypeDefinitions: yap yap yap
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
  interface StaticDataRouteOption {
    fadeBorder?: boolean;
    footer?: boolean;
  }
  // biome-ignore-end lint/style/useConsistentTypeDefinitions: yap yap yap
}
