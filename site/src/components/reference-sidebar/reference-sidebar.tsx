import type { ReactElement } from 'react';
import type { ReferenceSidebar as ReferenceSidebarData } from '#docs/build-reference-sidebar';
import { ReferenceSidebarModule } from './reference-sidebar-module';
import styles from './reference-sidebar.module.css';

export interface ReferenceSidebarProps {
  data: ReferenceSidebarData;
}

export function ReferenceSidebar(props: ReferenceSidebarProps): ReactElement {
  const { data } = props;
  return (
    <nav className={styles.ReferenceSidebar} aria-label="Reference navigation">
      <ul className={styles.ModuleList}>
        {data.modules.map((module) => (
          <li key={module.id}>
            <ReferenceSidebarModule module={module} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
