import type { ReactElement } from 'react';
import type { SidebarNode } from '#lib/sidebars';

import styles from './guide-navigation.module.css';
import { GuideNavigationGroup } from './guide-navigation-group';
import { GuideNavigationLink } from './guide-navigation-link';

export interface GuideNavigationProps {
  items: SidebarNode[];
}

export function GuideNavigation(props: GuideNavigationProps): ReactElement {
  const { items } = props;
  return (
    <nav
      aria-label="Guide navigation"
      className={styles.GuideNavigation}
    >
      {items.map((node) =>
        node.type === 'group' ? (
          <GuideNavigationGroup
            depth={0}
            key={`group:${node.title}`}
            node={node}
          />
        ) : (
          <GuideNavigationLink
            key={node.href}
            node={node}
          />
        ),
      )}
    </nav>
  );
}
