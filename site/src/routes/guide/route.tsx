import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import { GuideLayout } from '#components/guide-layout';
import { GuideNavigation } from '#components/guide-navigation';

const loadSidebar = createServerFn({ method: 'GET' }).handler(async () => {
  const { buildGuideSidebar } = await import('#lib/build-sidebar');
  return buildGuideSidebar(process.cwd());
});

export const Route = createFileRoute('/guide')({
  async loader() {
    const sidebar = await loadSidebar();
    return { sidebar };
  },
  component: Component,
});

function Component(): ReactElement {
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
