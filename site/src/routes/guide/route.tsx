import { createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import { GuideSidebar } from '#components/guide-sidebar';
import styles from './route.module.css';

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
    <div className={styles.GuideLayout}>
      <GuideSidebar items={sidebar} />
      <main className={styles.Content}>
        <Outlet />
      </main>
    </div>
  );
}
