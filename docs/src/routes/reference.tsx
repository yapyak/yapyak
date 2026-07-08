import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { getHeadings } from '@yapyak/doc-compiler';
import { useMemo } from 'react';
import { t } from 'yapyak';

import { ContentAnchorNavigation } from '#components/content-anchor-navigation';
import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { OutlineDrawerTrigger } from '#components/outline-drawer-trigger';
import { PageAction } from '#components/page-action';
import { SidebarDrawerTrigger } from '#components/sidebar-drawer-trigger';

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
          end={<OutlineDrawerTrigger page={page} />}
          start={<SidebarDrawerTrigger drawer={sidebarContent} />}
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
        <PageAction page={page} />
      </ContentLayout.Outline>
    </ContentLayout>
  );
}
