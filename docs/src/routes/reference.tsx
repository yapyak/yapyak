import { createFileRoute, Outlet } from '@tanstack/react-router';

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
    </ContentLayout>
  );
}
