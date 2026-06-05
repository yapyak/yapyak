import { createFileRoute, getRouteApi, Outlet } from '@tanstack/react-router';
import { getHeadings } from '@yapyak/doc-extractor';
import { useMemo } from 'react';
import { t } from 'yapyak';

import { ContentAnchorNavigation } from '#components/content-anchor-navigation';
import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';

import { doc } from 'virtual:doc-extractor';

const splatRoute = getRouteApi('/guide/$');

export const Route = createFileRoute('/guide')({
  beforeLoad() {
    return { sidebar: doc.getSidebar('guide') };
  },
  component: Component,
});

function Component() {
  const { sidebar } = Route.useRouteContext();
  const { page } = splatRoute.useLoaderData();

  const sidebarContent = (
    <ContentNavigation
      aria-label={t('Guide navigation')}
      tree={sidebar}
    />
  );

  const headings = useMemo(
    () => getHeadings(page, { maxLevel: 3, minLevel: 2 }),
    [page],
  );

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>{sidebarContent}</ContentLayout.Sidebar>
      <ContentLayout.Content>
        <Outlet />
      </ContentLayout.Content>
      <ContentLayout.Outline>
        <ContentAnchorNavigation headings={headings} />
      </ContentLayout.Outline>
      <ContentLayout.Toolbar page={page}>
        {sidebarContent}
      </ContentLayout.Toolbar>
    </ContentLayout>
  );
}
