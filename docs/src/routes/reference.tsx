import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ContentLayout } from '#components/content-layout';
import { ContentNavigation } from '#components/content-navigation';
import { loadReferenceSidebar } from '#lib/reference';

const loadData = createServerFn().handler(() => loadReferenceSidebar());

export const Route = createFileRoute('/reference')({
  component: Component,
  async loader() {
    const sidebar = await loadData();
    return { sidebar };
  },
});

function Component() {
  const { sidebar } = Route.useLoaderData();
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
