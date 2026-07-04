import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { getHeadings } from '@yapyak/doc-compiler';
import { useMemo } from 'react';
import { t } from 'yapyak';

import { ContentAnchorNavigation } from '#components/content-anchor-navigation';
import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { DialogTrigger } from '#components/dialog-trigger';
import { Drawer } from '#components/drawer';
import { Icon } from '#components/icon';
import { IconButton } from '#components/icon-button';
import { PageAction } from '#components/page-action';
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

  const sidebarContent = (
    <ContentNavigation
      aria-label={t('Reference navigation')}
      tree={sidebar}
    />
  );

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>{sidebarContent}</ContentLayout.Sidebar>

      <ContentLayout.Content>
        <ContentLayout.ContentHeader
          end={
            !isOutlineInline && (
              <DialogTrigger
                dialog={(dialogProps) => (
                  <Drawer
                    {...dialogProps}
                    direction="end"
                  >
                    <ContentAnchorNavigation
                      headings={headings}
                      key={page.href}
                    />
                    <PageAction href={page.href} />
                  </Drawer>
                )}
              >
                {(triggerProps) => (
                  <IconButton
                    {...triggerProps}
                    icon={<Icon name="outline" />}
                    iconPosition="trailing"
                  >
                    {t('Page')}
                  </IconButton>
                )}
              </DialogTrigger>
            )
          }
          start={
            !isSidebarInline && (
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
                    icon={<Icon name="sidebar" />}
                  >
                    {t('Menu')}
                  </IconButton>
                )}
              </DialogTrigger>
            )
          }
        />

        <ContentLayout.ContentContent>
          <Outlet />
        </ContentLayout.ContentContent>
      </ContentLayout.Content>

      <ContentLayout.Outline>
        <ContentAnchorNavigation
          headings={headings}
          indicator={true}
          key={page.href}
        />
        <PageAction href={page.href} />
      </ContentLayout.Outline>
    </ContentLayout>
  );
}
