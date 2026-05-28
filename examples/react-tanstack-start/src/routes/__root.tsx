import type { ReactElement } from 'react';

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { LocaleProvider, useLocale } from '@yapyak/react';

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { content: 'width=device-width, initial-scale=1', name: 'viewport' },
      { title: 'yapyak — TanStack Start example' },
    ],
  }),
});

function RootComponent(): ReactElement {
  const [locale] = useLocale();
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        <LocaleProvider>
          <Outlet />
        </LocaleProvider>
        <Scripts />
      </body>
    </html>
  );
}
