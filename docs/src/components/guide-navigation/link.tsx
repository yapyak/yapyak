import type { SidebarLink } from '#lib/sidebars';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import styles from './link.module.css';

export interface GuideNavigationLinkProps {
  node: SidebarLink;
}

export function GuideNavigationLink(props: GuideNavigationLinkProps) {
  const { node } = props;

  return (
    <Box
      as={Link}
      className={styles.GuideNavigationLink}
      to={node.href}
    >
      {node.title}
    </Box>
  );
}
