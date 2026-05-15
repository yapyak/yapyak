import { Link } from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import type { SidebarGroup, SidebarNode } from '#lib/sidebars';
import { GuideNavigationLink } from './guide-navigation-link';
import styles from './guide-navigation-group.module.css';

export interface GuideNavigationGroupProps {
  node: SidebarGroup;
  depth: number;
}

export function GuideNavigationGroup(
  props: GuideNavigationGroupProps,
): ReactElement {
  const { node, depth } = props;
  return (
    <div className={styles.GuideNavigationGroup} data-depth={depth}>
      <Title node={node} />
      <ul className={styles.Items}>
        {node.items.map((child) => (
          <li key={getKey(child)}>{renderChild(child, depth + 1)}</li>
        ))}
      </ul>
    </div>
  );
}

interface TitleProps {
  node: SidebarGroup;
}

function Title(props: TitleProps): ReactNode {
  const { node } = props;
  if (node.href === undefined) {
    return <h3 className={styles.Title}>{node.title}</h3>;
  }
  return (
    <Link to={node.href} className={styles.TitleLink}>
      {node.title}
    </Link>
  );
}

function renderChild(child: SidebarNode, depth: number): ReactElement {
  if (child.type === 'group') {
    return <GuideNavigationGroup node={child} depth={depth} />;
  }
  return <GuideNavigationLink node={child} />;
}

function getKey(node: SidebarNode): string {
  if (node.type === 'link') {
    return node.href;
  }
  return `group:${node.title}`;
}
