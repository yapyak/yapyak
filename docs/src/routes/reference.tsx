import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { loadSidebar } from '#lib/reference';

const loadData = createServerFn().handler(() => loadSidebar());

export const Route = createFileRoute('/reference')({
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
