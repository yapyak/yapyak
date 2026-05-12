import type { ReactElement } from 'react';
import type { SidebarNode } from '#lib/sidebars';
import { GuideSidebarGroup } from './guide-sidebar-group';
import { GuideSidebarLink } from './guide-sidebar-link';
import styles from './guide-sidebar.module.css';

export interface GuideSidebarProps {
  items: SidebarNode[];
}

export function GuideSidebar(props: GuideSidebarProps): ReactElement {
  const { items } = props;
  return (
    <nav className={styles.GuideSidebar} aria-label="Guide navigation">
      {items.map((node) =>
        node.type === 'group' ? (
          <GuideSidebarGroup
            key={`group:${node.title}`}
            node={node}
            depth={0}
          />
        ) : (
          <GuideSidebarLink key={node.href} node={node} />
        ),
      )}
    </nav>
  );
}
