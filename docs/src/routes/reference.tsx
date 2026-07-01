import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { getHeadings } from '@yapyak/doc-compiler';
import { useMemo } from 'react';
import { t } from 'yapyak';

import { ContentAnchorNavigation } from '#components/content-anchor-navigation';
import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { DialogTrigger } from '#components/dialog-trigger';
import { Drawer } from '#components/drawer';
import { IconButton } from '#components/icon-button';
import { OutlineIcon } from '#components/outline-icon';
import { PageAction } from '#components/page-action';
import { SidebarIcon } from '#components/sidebar-icon';
import { useMediaQuery } from '#hooks/use-media-query';

import { doc } from 'virtual:doc-compiler';

const splatRoute = getRouteApi('/reference/$');

export const Route = createFileRoute('/reference')({
  beforeLoad() {
    return {
      sidebar: doc.getSidebar('reference'),
    };
  },
  component: Component,
});

function Component() {
  const { sidebar } = Route.useRouteContext();
  const { page } = splatRoute.useLoaderData();

  const isSidebarInline = useMediaQuery('(min-width: 1024px)');
  const isOutlineInline = useMediaQuery('(min-width: 1324px)');

  const sidebarContent = (
    <ContentNavigation
      aria-label={t('Reference navigation')}
      tree={sidebar}
    />
  );

  const headings = useMemo(
    () =>
      getHeadings(page, {
        maxLevel: 3,
        minLevel: 2,
      }),
    [
      page,
    ],
  );

  const outlineDrawerContent = (
    <>
      <ContentAnchorNavigation
        headings={headings}
        key={page.href}
      />
      <PageAction href={page.href} />
    </>
  );

  const outlineInlineContent = (
    <>
      <ContentAnchorNavigation
        headings={headings}
        key={page.href}
        rail={true}
      />
      <PageAction
        href={page.href}
        rail={true}
      />
    </>
  );

  const sidebarTrigger = !isSidebarInline && (
    <DialogTrigger
      dialog={(dialogProps) => (
        <Drawer
          {...dialogProps}
          direction="start"
        >
          {sidebarContent}
        </Drawer>
      )}
    >
      {(triggerProps) => (
        <IconButton
          {...triggerProps}
          aria-label={t('Open menu')}
          icon={<SidebarIcon />}
        >
          {t('Menu')}
        </IconButton>
      )}
    </DialogTrigger>
  );

  const outlineTrigger = !isOutlineInline && headings.length > 0 && (
    <DialogTrigger
      dialog={(dialogProps) => (
        <Drawer
          {...dialogProps}
          direction="end"
        >
          {outlineDrawerContent}
        </Drawer>
      )}
    >
      {(triggerProps) => (
        <IconButton
          {...triggerProps}
          aria-label={t('Open page outline')}
          icon={<OutlineIcon />}
          iconPosition="trailing"
        >
          {t('Page')}
        </IconButton>
      )}
    </DialogTrigger>
  );

  return (
    <ContentLayout>
      {isSidebarInline && (
        <ContentLayout.Sidebar>{sidebarContent}</ContentLayout.Sidebar>
      )}

      <ContentLayout.Content>
        <ContentLayout.ContentHeader
          end={outlineTrigger}
          start={sidebarTrigger}
        />

        <ContentLayout.ContentContent>
          <Outlet />
        </ContentLayout.ContentContent>
      </ContentLayout.Content>

      {isOutlineInline && (
        <ContentLayout.Outline>{outlineInlineContent}</ContentLayout.Outline>
      )}
    </ContentLayout>
  );
}
