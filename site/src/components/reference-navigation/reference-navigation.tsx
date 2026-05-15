import type { ReactElement } from 'react';
import type { ReferenceSidebar as ReferenceSidebarData } from '#docs/build-reference-sidebar';
import { ReferenceNavigationModule } from './reference-navigation-module';
import { ReferenceNavigationSymbol } from './reference-navigation-symbol';
import styles from './reference-navigation.module.css';

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
        className={styles.ReferenceNavigation}
        aria-label="Reference navigation"
      />
    );
  }
  return (
    <nav
      className={styles.ReferenceNavigation}
      aria-label="Reference navigation"
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
