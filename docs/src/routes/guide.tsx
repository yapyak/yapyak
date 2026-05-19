import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { GuideLayout } from '#components/guide-layout';
import { GuideNavigation } from '#components/guide-navigation';
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
    <GuideLayout>
      <GuideLayout.Sidebar>
        <GuideNavigation items={sidebar} />
      </GuideLayout.Sidebar>
      <GuideLayout.Content>
        <Outlet />
      </GuideLayout.Content>
    </GuideLayout>
  );
}
