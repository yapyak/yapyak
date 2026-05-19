import type { NavLink } from '#lib/navigation';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import styles from './link.module.css';

export interface ContentNavigationLinkProps {
  node: NavLink;
}

export function ContentNavigationLink(props: ContentNavigationLinkProps) {
  const { node } = props;
  const isDeprecated = node.badge?.variant === 'deprecated';

  return (
    <Box
      activeOptions={{ exact: true }}
      as={Link}
      className={styles.ContentNavigationLink}
      data-deprecated={isDeprecated}
      to={node.href}
    >
      {node.label}
    </Box>
  );
}
