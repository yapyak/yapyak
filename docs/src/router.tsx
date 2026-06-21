import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    basepath: import.meta.env.BASE_URL,
    defaultHashScrollIntoView: {
      behavior: 'smooth',
      block: 'start',
    },
    defaultPreload: 'intent',
    routeTree,
    scrollRestoration: true,
    scrollToTopSelectors: [
      '#sidebar',
    ],
  });
}

declare module '@tanstack/react-router' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
