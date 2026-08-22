import type { ReactNode } from 'react';
import type { Route } from './+types/root';

import { useLocale, useTextDirection } from '@yapyak/react';
import { middleware as yapyakMiddleware } from '@yapyak/react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

export const middleware: Route.MiddlewareFunction[] = [
  yapyakMiddleware,
];

export function Layout({ children }: { children: ReactNode }) {
  const textDirection = useTextDirection();
  const [locale] = useLocale();

  return (
    <html
      dir={textDirection}
      lang={locale}
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          content="width=device-width, initial-scale=1"
          name="viewport"
        />
        <title>yapyak — React Router example</title>
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
