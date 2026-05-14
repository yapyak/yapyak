import type { ReactElement } from 'react';
import type { ReferenceSidebar as ReferenceSidebarData } from '#docs/build-reference-sidebar';
import { ReferenceSidebarModule } from './reference-sidebar-module';
import { ReferenceSidebarSymbol } from './reference-sidebar-symbol';
import styles from './reference-sidebar.module.css';

export interface ReferenceSidebarProps {
  data: ReferenceSidebarData;
}

export function ReferenceSidebar(props: ReferenceSidebarProps): ReactElement {
  const { data } = props;
  const root = data.modules.find((m) => m.id === 'yapyak');
  if (root === undefined) {
    return (
      <nav
        className={styles.ReferenceSidebar}
        aria-label="Reference navigation"
      />
    );
  }
  return (
    <nav className={styles.ReferenceSidebar} aria-label="Reference navigation">
      <ul className={styles.ItemList}>
        {root.symbols.map((symbol) => (
          <li key={symbol.href}>
            <ReferenceSidebarSymbol symbol={symbol} />
          </li>
        ))}
        {root.submodules.map((submodule) => (
          <li key={submodule.id}>
            <ReferenceSidebarModule module={submodule} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
