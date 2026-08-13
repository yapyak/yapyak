import '#styles/index.css';

import type { ReactNode } from 'react';
import type { MobileMode } from '#components/mobile-bar';

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
import { MobileBar } from '#components/mobile-bar';
import { Navigation } from '#components/navigation';
import { OptionMenuTrigger } from '#components/option-menu-trigger';
import { OptionProvider } from '#components/option-provider';
import { Root } from '#components/root';
import { RouteAnnouncer } from '#components/route-announcer';
import { SearchDialogTrigger } from '#components/search-dialog-trigger';
import { StatusView } from '#components/status-view';
import { useScrollRestoration } from '#hooks/use-scroll-restoration';
import { useStripOptionSearch } from '#hooks/use-strip-option-search';
import { buildPrepaintScript } from '#lib/option';

import { doc } from 'virtual:docs-compiler';

export type OptionSearch = Record<string, string>;

export const Route = createRootRoute({
  validateSearch(search: Record<string, unknown>): OptionSearch {
    const next: OptionSearch = {};
    for (const [key, value] of Object.entries(search)) {
      if (typeof value === 'string') {
        next[key] = value;
      }
    }
    return next;
  },
  head() {
    return {
      links: [
        {
          href: '/favicon.svg',
          rel: 'icon',
          type: 'image/svg+xml',
        },
      ],
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          content:
            'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content',
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
          content: 'https://yapyak.dev/social-card.png',
          property: 'og:image',
        },
        {
          content: 'yapyak - i18n that keeps up.',
          property: 'og:image:alt',
        },
        {
          content: '640',
          property: 'og:image:height',
        },
        {
          content: 'image/png',
          property: 'og:image:type',
        },
        {
          content: '1280',
          property: 'og:image:width',
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
        {
          content: 'https://yapyak.dev/social-card.png',
          name: 'twitter:image',
        },
        {
          content: 'yapyak - i18n that keeps up.',
          name: 'twitter:image:alt',
        },
      ],
    };
  },
  component: Component,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  shellComponent: ShellComponent,
});

function Component() {
  useScrollRestoration();
  useStripOptionSearch();

  const [mobileMode, setMobileMode] = useState<MobileMode>('closed');
  const isMobileDialogOpen = mobileMode !== 'closed';

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
        {mobileMode === 'search' ? null : (
          <Layout.Header.Start>
            <LogoLink />
          </Layout.Header.Start>
        )}
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
          <OptionMenuTrigger group="framework" />
          <OptionMenuTrigger group="packageManager" />
          <SearchDialogTrigger shortcut="mod+k" />
          <IconLink
            aria-label={t('View on GitHub')}
            href="https://github.com/yapyak/yapyak"
          >
            <Icon name="github" />
          </IconLink>
        </Layout.Header.End>
        <MobileBar
          mode={mobileMode}
          onModeChange={setMobileMode}
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
  const optionsPrepaintScript = buildPrepaintScript(doc.getOptionsRegistry());

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
