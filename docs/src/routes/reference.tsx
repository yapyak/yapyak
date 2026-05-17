import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ReferenceLayout } from '#components/reference-layout';
import { ReferenceNavigation } from '#components/reference-navigation';

const loadSidebar = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadManifest } = await import('#docs/load-manifest');
  const { buildReferenceSidebar } = await import(
    '#docs/build-reference-sidebar'
  );
  const manifest = await loadManifest(process.cwd());
  return buildReferenceSidebar(manifest);
});

export const Route = createFileRoute('/reference')({
  component: Component,
  async loader() {
    const sidebar = await loadSidebar();
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
