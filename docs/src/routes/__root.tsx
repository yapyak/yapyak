import '#styles/index.css';

import type { ReactNode } from 'react';

import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useMatches,
} from '@tanstack/react-router';
import { useLocale } from '@yapyak/react';
import { t } from 'yapyak';

import { Colophon } from '#components/colophon';
import { GithubIcon } from '#components/github-icon';
import { IconLink } from '#components/icon-link';
import { Layout } from '#components/layout';
import { LogoLink } from '#components/logo-link';
import { Navigation } from '#components/navigation';
import { NotFoundView } from '#components/not-found-view';
import { OptionMenu } from '#components/option-menu';
import {
  OptionProvider,
  buildPrepaintScript,
} from '#components/option-provider';
import { Root } from '#components/root';
import { useScrollRestoration } from '#hooks/use-scroll-restoration';
import { assetUrl } from '#utils/asset';

import { doc } from 'virtual:doc-compiler';

export const Route = createRootRoute({
  component: Component,
  head() {
    return {
      links: [
        {
          href: assetUrl('favicon.svg'),
          rel: 'icon',
          type: 'image/svg+xml',
        },
      ],
      meta: [
        // Remove before yapyak.dev launch.
        {
          content: 'noindex',
          name: 'robots',
        },
        {
          charSet: 'utf-8',
        },
        {
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
          name: 'viewport',
        },
        {
          title: 'yapyak - i18n that keeps up.',
        },
        {
          content: 'For Vite apps that move at the speed of save.',
          name: 'description',
        },
        {
          content: 'yapyak - i18n that keeps up.',
          property: 'og:title',
        },
        {
          content: 'For Vite apps that move at the speed of save.',
          property: 'og:description',
        },
        {
          content: 'website',
          property: 'og:type',
        },
        {
          content: 'summary_large_image',
          name: 'twitter:card',
        },
        {
          content: 'yapyak - i18n that keeps up.',
          name: 'twitter:title',
        },
        {
          content: 'For Vite apps that move at the speed of save.',
          name: 'twitter:description',
        },
      ],
    };
  },
  notFoundComponent: NotFoundComponent,
  shellComponent: ShellComponent,
});

function Component() {
  useScrollRestoration();

  const shouldFadeBorder = useMatches({
    select: (matches) =>
      matches.some((match) => match.staticData.fadeBorder === true),
  });

  const hasFooter = useMatches({
    select: (matches) =>
      matches.some((match) => match.staticData.footer === true),
  });

  return (
    <Layout>
      <Layout.Header fadeBorder={shouldFadeBorder}>
        <Layout.Header.Start>
          <LogoLink />
        </Layout.Header.Start>
        <Layout.Header.Center>
          <Navigation>
            <Navigation.Link to="/home">{t('Home')}</Navigation.Link>
            <Navigation.Link to="/guide">{t('Guide')}</Navigation.Link>
            <Navigation.Link to="/reference">{t('Reference')}</Navigation.Link>
          </Navigation>
        </Layout.Header.Center>
        <Layout.Header.End>
          <OptionMenu group="framework" />
          <OptionMenu group="packageManager" />
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
      {hasFooter && (
        <Layout.Footer>
          <Colophon />
        </Layout.Footer>
      )}
    </Layout>
  );
}

type ShellComponentProps = {
  children: ReactNode;
};

function ShellComponent(props: ShellComponentProps) {
  const { children } = props;

  const [locale] = useLocale();
  const optionsPrepaintScript = buildPrepaintScript(doc.getOptions());

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: optionsPrepaintScript,
          }}
        />
      </head>
      <body>
        <Root>
          <OptionProvider>{children}</OptionProvider>
        </Root>
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return <NotFoundView />;
}
