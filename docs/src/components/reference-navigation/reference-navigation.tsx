import type { ReactElement } from 'react';
import type { ReferenceSidebar as ReferenceSidebarData } from '#docs/build-reference-sidebar';

import styles from './reference-navigation.module.css';
import { ReferenceNavigationModule } from './reference-navigation-module';
import { ReferenceNavigationSymbol } from './reference-navigation-symbol';

export interface ReferenceNavigationProps {
  data: ReferenceSidebarData;
}

export function ReferenceNavigation(
  props: ReferenceNavigationProps,
): ReactElement {
  const { data } = props;
  const root = data.modules.find((m) => m.id === 'yapyak');
  if (root === undefined) {
    return (
      <nav
        aria-label="Reference navigation"
        className={styles.ReferenceNavigation}
      />
    );
  }
  return (
    <nav
      aria-label="Reference navigation"
      className={styles.ReferenceNavigation}
    >
      <ul className={styles.ItemList}>
        {root.symbols.map((symbol) => (
          <li key={symbol.href}>
            <ReferenceNavigationSymbol symbol={symbol} />
          </li>
        ))}
        {root.submodules.map((submodule) => (
          <li key={submodule.id}>
            <ReferenceNavigationModule module={submodule} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
