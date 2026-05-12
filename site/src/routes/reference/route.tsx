import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import styles from './route.module.css';

export const Route = createFileRoute('/reference')({
  component: Component,
});

function Component(): ReactElement {
  return (
    <div className={styles.ReferenceLayout}>
      <aside className={styles.Sidebar}>
        <h3 className={styles.SidebarHeading}>Reference</h3>
      </aside>
      <main className={styles.Content}>
        <Outlet />
      </main>
    </div>
  );
}
