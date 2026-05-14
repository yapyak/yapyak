import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import { ReferenceSidebar } from '#components/reference-sidebar';
import styles from './route.module.css';

const loadSidebar = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadManifest } = await import('#docs/load-manifest');
  const { buildReferenceSidebar } = await import('#docs/build-reference-sidebar');
  const manifest = await loadManifest(process.cwd());
  return buildReferenceSidebar(manifest);
});

export const Route = createFileRoute('/reference')({
  async loader() {
    const sidebar = await loadSidebar();
    return { sidebar };
  },
  component: Component,
});

function Component(): ReactElement {
  const { sidebar } = Route.useLoaderData();
  return (
    <div className={styles.ReferenceLayout}>
      <ReferenceSidebar data={sidebar} />
      <main className={styles.Content}>
        <Outlet />
      </main>
    </div>
  );
}
