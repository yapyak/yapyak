import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { getHeadings } from '@yapyak/doc-compiler';
import { useMemo } from 'react';

import { ContentAnchorNavigation } from '#components/content-anchor-navigation';
import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { PageAction } from '#components/page-action';

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

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>
        <ContentNavigation
          aria-label="Reference navigation"
          tree={sidebar}
        />
      </ContentLayout.Sidebar>
      <ContentLayout.Content>
        <ContentLayout.ContentHeader page={page} />
        <ContentLayout.ContentContent>
          <Outlet />
        </ContentLayout.ContentContent>
      </ContentLayout.Content>
      <ContentLayout.Outline>
        <ContentAnchorNavigation
          headings={headings}
          key={page.href}
        />
        <PageAction href={page.href} />
      </ContentLayout.Outline>
    </ContentLayout>
  );
}
