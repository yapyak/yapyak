import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { GuideSidebar } from '#components/guide-sidebar';
import { guideSidebar } from '#lib/sidebars';
import styles from './route.module.css';

export const Route = createFileRoute('/guide')({
  component: Component,
});

function Component(): ReactElement {
  return (
    <div className={styles.GuideLayout}>
      <GuideSidebar items={guideSidebar} />
      <main className={styles.Content}>
        <Outlet />
      </main>
    </div>
  );
}
