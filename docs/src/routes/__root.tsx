import '#styles/index.css';

import type { ReactNode } from 'react';

import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { LocaleProvider, useLocale } from '@yapyak/react';
import { t } from 'yapyak';

import { Colophon } from '#components/colophon';
import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';
import { Layout } from '#components/layout';
import { Navigation } from '#components/navigation';
import {
  buildPrepaintScript,
  DocOptions,
  OptionsProvider,
} from '#components/options';
import { Wordmark } from '#components/wordmark';

import { doc } from 'virtual:doc-extractor';

export const Route = createRootRoute({
  component: Component,
  head() {
    return {
      links: [{ href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' }],
      meta: [
        { charSet: 'utf-8' },
        { content: 'width=device-width, initial-scale=1', name: 'viewport' },
        { title: 'yapyak — i18n that keeps up.' },
        {
          content: 'For Vite apps built at the speed of save.',
          name: 'description',
        },
        {
          content: 'yapyak — i18n that keeps up.',
          property: 'og:title',
        },
        {
          content: 'For Vite apps built at the speed of save.',
          property: 'og:description',
        },
        { content: 'website', property: 'og:type' },
        { content: 'summary_large_image', name: 'twitter:card' },
        {
          content: 'yapyak — i18n that keeps up.',
          name: 'twitter:title',
        },
        {
          content: 'For Vite apps built at the speed of save.',
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
          <DocOptions />
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
  const optionsPrepaintScript = buildPrepaintScript(doc.getOptions());

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: yap yap yap
          dangerouslySetInnerHTML={{ __html: optionsPrepaintScript }}
        />
      </head>
      <body>
        <LocaleProvider>
          <OptionsProvider>{children}</OptionsProvider>
        </LocaleProvider>
        <Scripts />
      </body>
    </html>
  );
}
