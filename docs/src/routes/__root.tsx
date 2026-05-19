import '../styles/index.css';

import type { ReactNode } from 'react';

import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { t } from 'yapyak';
import { useLocale } from 'yapyak/react';

import { Colophon } from '#components/colophon';
import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';
import { Layout } from '#components/layout';
import { Navigation } from '#components/navigation';
import { Wordmark } from '#components/wordmark';

export const Route = createRootRoute({
  component: Component,
  head() {
    return {
      links: [{ href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' }],
      meta: [
        { charSet: 'utf-8' },
        { content: 'width=device-width, initial-scale=1', name: 'viewport' },
        { title: 'yapyak — i18n that maintains itself.' },
        {
          content: 'Built for Vite. Designed for the AI era.',
          name: 'description',
        },
        {
          content: 'yapyak — i18n that maintains itself.',
          property: 'og:title',
        },
        {
          content: 'Built for Vite. Designed for the AI era.',
          property: 'og:description',
        },
        { content: 'website', property: 'og:type' },
        { content: 'summary_large_image', name: 'twitter:card' },
        {
          content: 'yapyak — i18n that maintains itself.',
          name: 'twitter:title',
        },
        {
          content: 'Built for Vite. Designed for the AI era.',
          name: 'twitter:description',
        },
      ],
    };
  },
  shellComponent: ShellComponent,
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
            aria-label={t('View on GitHub')}
            href="https://github.com/yapyak/yapyak"
          >
            <GithubIcon />
          </IconLink>
        </Layout.Header.End>
      </Layout.Header>
      <Layout.Main>
        <Outlet />
      </Layout.Main>
      <Layout.Footer>
        <Colophon />
      </Layout.Footer>
    </Layout>
  );
}

interface ShellComponentProps {
  children: ReactNode;
}

function ShellComponent(props: ShellComponentProps) {
  const { children } = props;

  const [locale] = useLocale();

  return (
    <html lang={locale}>
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
