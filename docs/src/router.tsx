import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

let lastSection: string | undefined;

export function getRouter() {
  return createRouter({
    basepath: import.meta.env.BASE_URL,
    defaultHashScrollIntoView: {
      behavior: 'smooth',
      block: 'start',
    },
    defaultPreload: 'intent',
    defaultViewTransition: true,
    routeTree,
    scrollRestoration: true,
    scrollToTopSelectors: [
      () => {
        const section = window.location.pathname.split('/')[1] ?? '';
        if (section === lastSection) {
          return null;
        }
        lastSection = section;
        return document.getElementById('sidebar');
      },
    ],
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
