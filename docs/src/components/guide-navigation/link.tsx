import type { ReactElement } from 'react';
import type { SidebarLink } from '#lib/sidebars';

import { Link } from '@tanstack/react-router';

import styles from './link.module.css';

export interface GuideNavigationLinkProps {
  node: SidebarLink;
}

export function GuideNavigationLink(
  props: GuideNavigationLinkProps,
): ReactElement {
  const { node } = props;
  return (
    <Link
      className={styles.GuideNavigationLink}
      to={node.href}
    >
      {node.title}
    </Link>
  );
}
