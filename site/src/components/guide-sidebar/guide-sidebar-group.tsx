import type { ReactElement } from 'react';
import type { SidebarGroup, SidebarNode } from '#lib/sidebars';
import { GuideSidebarLink } from './guide-sidebar-link';
import styles from './guide-sidebar-group.module.css';

export interface GuideSidebarGroupProps {
  node: SidebarGroup;
  depth: number;
}

export function GuideSidebarGroup(
  props: GuideSidebarGroupProps,
): ReactElement {
  const { node, depth } = props;
  return (
    <div className={styles.GuideSidebarGroup} data-depth={depth}>
      <h3 className={styles.Title}>{node.title}</h3>
      <ul className={styles.Items}>
        {node.items.map((child) => (
          <li key={getKey(child)}>{renderChild(child, depth + 1)}</li>
        ))}
      </ul>
    </div>
  );
}

function renderChild(child: SidebarNode, depth: number): ReactElement {
  if (child.type === 'group') {
    return <GuideSidebarGroup node={child} depth={depth} />;
  }
  return <GuideSidebarLink node={child} />;
}

function getKey(node: SidebarNode): string {
  if (node.type === 'link') {
    return node.href;
  }
  return `group:${node.title}`;
}
