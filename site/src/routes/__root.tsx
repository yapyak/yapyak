import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Nav } from '#components/nav';
import '../style.css';

export const Route = createRootRoute({
  head() {
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: 'yapyak — The i18n Library for Vite apps' },
        {
          name: 'description',
          content:
            'yapyak is a self-maintaining i18n library that translates your strings as you save.',
        },
      ],
      links: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    };
  },
  shellComponent: ShellComponent,
  component: Component,
});

function Component() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

interface RootDocumentProps {
  children: ReactNode;
}

function ShellComponent(props: RootDocumentProps): ReactNode {
  const { children } = props;
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
