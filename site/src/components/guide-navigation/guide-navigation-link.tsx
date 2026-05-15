import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import type { SidebarLink } from '#lib/sidebars';
import styles from './guide-navigation-link.module.css';

export interface GuideNavigationLinkProps {
  node: SidebarLink;
}

export function GuideNavigationLink(
  props: GuideNavigationLinkProps,
): ReactElement {
  const { node } = props;
  return (
    <Link to={node.href} className={styles.GuideNavigationLink}>
      {node.title}
    </Link>
  );
}
