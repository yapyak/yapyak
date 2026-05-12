import '../style.css';

import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { t } from 'yapyak';
import { GitHubIcon } from '#components/icon';
import { IconLink } from '#components/icon-link';
import { Layout } from '#components/layout';
import { Wordmark } from '#components/wordmark';
import { Navigation } from '#components/navigation';

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
    <Layout>
      <Layout.Header>
        <Layout.Header.Start>
          <Link to="/">
            <Wordmark />
          </Link>
        </Layout.Header.Start>
        <Layout.Header.Center>
          <Navigation>
            <Navigation.Link to="/">{t('Home')}</Navigation.Link>
            <Navigation.Link to="/guide">{t('Guide')}</Navigation.Link>
            <Navigation.Link to="/reference">{t('Reference')}</Navigation.Link>
          </Navigation>
        </Layout.Header.Center>
        <Layout.Header.End>
          <IconLink
            href="https://github.com/yapyak/yapyak"
            aria-label={t('View on GitHub')}
          >
            <GitHubIcon />
          </IconLink>
        </Layout.Header.End>
      </Layout.Header>
      <Layout.Main>
        <Outlet />
      </Layout.Main>
    </Layout>
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
