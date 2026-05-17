import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ReferenceLayout } from '#components/reference-layout';
import { ReferenceNavigation } from '#components/reference-navigation';
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
    <ReferenceLayout>
      <ReferenceLayout.Sidebar>
        <ReferenceNavigation data={sidebar} />
      </ReferenceLayout.Sidebar>
      <ReferenceLayout.Content>
        <Outlet />
      </ReferenceLayout.Content>
    </ReferenceLayout>
  );
}
