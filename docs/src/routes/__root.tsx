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
import { useState } from 'react';
import { t } from 'yapyak';

import { Colophon } from '#components/colophon';
import { Icon } from '#components/icon';
import { IconLink } from '#components/icon-link';
import { Layout } from '#components/layout';
import { LogoLink } from '#components/logo-link';
import { MobileDialogTrigger } from '#components/mobile-dialog-trigger';
import { Navigation } from '#components/navigation';
import { OptionMenuTrigger } from '#components/option-menu-trigger';
import {
  OptionProvider,
  buildPrepaintScript,
} from '#components/option-provider';
import { Root } from '#components/root';
import { RouteAnnouncer } from '#components/route-announcer';
import { SearchDialogTrigger } from '#components/search-dialog-trigger';
import { StatusView } from '#components/status-view';
import { useScrollRestoration } from '#hooks/use-scroll-restoration';
import { assetUrl } from '#utils/asset';

import { doc } from 'virtual:doc-compiler';

export const Route = createRootRoute({
  component: Component,
  errorComponent: ErrorComponent,
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

  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);

  const shouldFadeBorder =
    useMatches({
      select: (matches) =>
        matches.some((match) => match.staticData.fadeBorder === true),
    }) && !isMobileDialogOpen;

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
            <Navigation.Link
              preload="render"
              to="/"
            >
              {t('Home')}
            </Navigation.Link>
            <Navigation.Link
              preload="render"
              to="/guide"
            >
              {t('Guide')}
            </Navigation.Link>
            <Navigation.Link
              preload="render"
              to="/reference"
            >
              {t('Reference')}
            </Navigation.Link>
          </Navigation>
        </Layout.Header.Center>
        <Layout.Header.End>
          <SearchDialogTrigger />
          <OptionMenuTrigger group="framework" />
          <IconLink
            aria-label={t('View on GitHub')}
            href="https://github.com/yapyak/yapyak"
          >
            <Icon name="github" />
          </IconLink>
        </Layout.Header.End>
        <MobileDialogTrigger
          onOpenChange={setIsMobileDialogOpen}
          open={isMobileDialogOpen}
        />
      </Layout.Header>
      <RouteAnnouncer />
      <Layout.Main inert={isMobileDialogOpen}>
        <Outlet />
      </Layout.Main>
      {hasFooter && (
        <Layout.Footer inert={isMobileDialogOpen}>
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

function ErrorComponent() {
  return (
    <StatusView
      code="500"
      message={t('Something went wrong')}
    />
  );
}

function NotFoundComponent() {
  return (
    <StatusView
      code="404"
      message={t('Page not found')}
    />
  );
}
