import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getSidebar } from '@yapyak/doc-extractor';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { manifest } from '#lib/manifest';

export const Route = createFileRoute('/guide')({
  beforeLoad() {
    return { sidebar: getSidebar(manifest, 'guide') };
  },
  component: Component,
});

function Component() {
  const { sidebar } = Route.useRouteContext();
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
    </ContentLayout>
  );
}
