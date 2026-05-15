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
import { useLocale } from 'yapyak/react';
import { Footer } from '#components/footer';
import { GitHubIcon } from '#components/icon';
import { IconLink } from '#components/icon-link';
import { Layout } from '#components/layout';
import { Navigation } from '#components/navigation';
import { Wordmark } from '#components/wordmark';

export const Route = createRootRoute({
  head() {
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: 'yapyak — i18n that maintains itself.' },
        {
          name: 'description',
          content: 'Built for Vite. Designed for the AI era.',
        },
        {
          property: 'og:title',
          content: 'yapyak — i18n that maintains itself.',
        },
        {
          property: 'og:description',
          content: 'Built for Vite. Designed for the AI era.',
        },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:title',
          content: 'yapyak — i18n that maintains itself.',
        },
        {
          name: 'twitter:description',
          content: 'Built for Vite. Designed for the AI era.',
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
      <Layout.Footer>
        <Footer />
      </Layout.Footer>
    </Layout>
  );
}

interface RootDocumentProps {
  children: ReactNode;
}

function ShellComponent(props: RootDocumentProps): ReactNode {
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
