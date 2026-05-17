import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { GuideLayout } from '#components/guide-layout';
import { GuideNavigation } from '#components/guide-navigation';
import { buildGuideSidebar } from '#lib/guide';

const loadData = createServerFn().handler(() =>
  buildGuideSidebar(process.cwd()),
);

export const Route = createFileRoute('/guide')({
  component: Component,
  async loader() {
    const sidebar = await loadData();
    return { sidebar };
  },
});

function Component() {
  const { sidebar } = Route.useLoaderData();
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
