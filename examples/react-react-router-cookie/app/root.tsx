import type { ReactNode } from 'react';
import type { Route } from './+types/root';

import { useLocale } from '@yapyak/react';
import { middleware as yapyakMiddleware } from '@yapyak/react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

export const middleware: Route.MiddlewareFunction[] = [
  yapyakMiddleware,
];

export function Layout({ children }: { children: ReactNode }) {
  const [locale] = useLocale();

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta
          content="width=device-width, initial-scale=1"
          name="viewport"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
