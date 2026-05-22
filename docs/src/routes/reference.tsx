import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/reference')({
  beforeLoad() {
    return { sidebar: doc.getSidebar('reference') };
  },
  component: Component,
});

function Component() {
  const { sidebar } = Route.useRouteContext();
  const { _splat } = useParams({ strict: false });
  const page = doc.getPage('reference', _splat);

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>
        <ContentNavigation
          aria-label="Reference navigation"
          tree={sidebar}
        />
      </ContentLayout.Sidebar>
      <ContentLayout.Content>
        <Outlet />
      </ContentLayout.Content>
      <ContentLayout.Toolbar page={page}>
        <ContentNavigation
          aria-label="Reference navigation"
          tree={sidebar}
        />
      </ContentLayout.Toolbar>
    </ContentLayout>
  );
}
