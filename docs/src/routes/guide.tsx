import { createFileRoute, getRouteApi, Outlet } from '@tanstack/react-router';
import { t } from 'yapyak';

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

  const navigation = (
    <ContentNavigation
      aria-label={t('Guide navigation')}
      tree={sidebar}
    />
  );

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>{navigation}</ContentLayout.Sidebar>
      <ContentLayout.Content>
        <Outlet />
      </ContentLayout.Content>
      <ContentLayout.Outline />
      <ContentLayout.Toolbar page={page}>{navigation}</ContentLayout.Toolbar>
    </ContentLayout>
  );
}
