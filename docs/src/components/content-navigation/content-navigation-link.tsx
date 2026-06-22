import type { SidebarLink } from '@yapyak/doc-compiler';

import { Link, useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { Box } from '#components/box';

import styles from './content-navigation-link.module.css';

export type ContentNavigationLinkProps = {
  node: SidebarLink;
};

export function ContentNavigationLink(props: ContentNavigationLinkProps) {
  const { node } = props;
  const isDeprecated = node.badge?.variant === 'deprecated';
  const ref = useRef<HTMLAnchorElement>(null);
  const isActive = useLocation({
    select: (location) => location.pathname === node.href,
  });

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [
    isActive,
  ]);

  return (
    <Box
      activeOptions={{
        exact: true,
      }}
      as={Link}
      className={styles.ContentNavigationLink}
      data-deprecated={isDeprecated}
      ref={ref}
      to={node.href}
    >
      {node.label}
    </Box>
  );
}
