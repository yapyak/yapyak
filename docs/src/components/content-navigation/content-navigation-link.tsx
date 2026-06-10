import type { SidebarLink } from '@yapyak/doc-extractor';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import styles from './content-navigation-link.module.css';

export type ContentNavigationLinkProps = {
  node: SidebarLink;
};

export function ContentNavigationLink(props: ContentNavigationLinkProps) {
  const { node } = props;
  const isDeprecated = node.badge?.variant === 'deprecated';

  return (
    <Box
      activeOptions={{
        exact: true,
      }}
      as={Link}
      className={styles.ContentNavigationLink}
      data-deprecated={isDeprecated}
      to={node.href}
    >
      {node.label}
    </Box>
  );
}
