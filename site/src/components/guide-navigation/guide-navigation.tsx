import type { ReactElement } from 'react';
import type { SidebarNode } from '#lib/sidebars';
import { GuideNavigationGroup } from './guide-navigation-group';
import { GuideNavigationLink } from './guide-navigation-link';
import styles from './guide-navigation.module.css';

export interface GuideNavigationProps {
  items: SidebarNode[];
}

export function GuideNavigation(props: GuideNavigationProps): ReactElement {
  const { items } = props;
  return (
    <nav className={styles.GuideNavigation} aria-label="Guide navigation">
      {items.map((node) =>
        node.type === 'group' ? (
          <GuideNavigationGroup
            key={`group:${node.title}`}
            node={node}
            depth={0}
          />
        ) : (
          <GuideNavigationLink key={node.href} node={node} />
        ),
      )}
    </nav>
  );
}
