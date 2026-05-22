import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/guide')({
  beforeLoad() {
    return { sidebar: doc.getSidebar('guide') };
  },
  component: Component,
});

function Component() {
  const { sidebar } = Route.useRouteContext();
  const splatMatch = useMatch({ from: '/guide/$', shouldThrow: false });
  const indexMatch = useMatch({ from: '/guide/', shouldThrow: false });
  const page =
    splatMatch?.loaderData?.page ?? indexMatch?.loaderData?.page ?? null;

  const navigation = (
    <ContentNavigation
      aria-label="Guide navigation"
      tree={sidebar}
    />
  );

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>{navigation}</ContentLayout.Sidebar>
      <ContentLayout.Content>
        <Outlet />
      </ContentLayout.Content>
      <ContentLayout.Toolbar page={page}>{navigation}</ContentLayout.Toolbar>
    </ContentLayout>
  );
}
