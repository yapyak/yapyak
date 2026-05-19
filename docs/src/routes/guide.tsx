import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { buildGuideSidebar } from '#lib/guide';

const loadData = createServerFn().handler(() =>
  buildGuideSidebar(process.cwd()),
);

export const Route = createFileRoute('/guide')({
  async beforeLoad() {
    const sidebar = await loadData();
    return { sidebar };
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
