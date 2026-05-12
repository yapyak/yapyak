import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import type { SidebarLink } from '#lib/sidebars';
import styles from './guide-sidebar-link.module.css';

export interface GuideSidebarLinkProps {
  node: SidebarLink;
}

export function GuideSidebarLink(
  props: GuideSidebarLinkProps,
): ReactElement {
  const { node } = props;
  return (
    <Link to={node.href} className={styles.GuideSidebarLink}>
      {node.title}
    </Link>
  );
}
