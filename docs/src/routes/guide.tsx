import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';

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
  const { _splat } = useParams({ strict: false });
  const page = doc.getPage('guide', _splat);

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>
        <ContentNavigation
          aria-label="Guide navigation"
          tree={sidebar}
        />
      </ContentLayout.Sidebar>
      <ContentLayout.Content>
        <Outlet />
      </ContentLayout.Content>
      <ContentLayout.Toolbar page={page}>
        <ContentNavigation
          aria-label="Guide navigation"
          tree={sidebar}
        />
      </ContentLayout.Toolbar>
    </ContentLayout>
  );
}
