import type { SidebarLink } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Link, useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { Box } from '#primitives/box';

import styles from './content-navigation-link.module.css';

export type ContentNavigationLinkProps = BoxProps<'a'> & {
  node: SidebarLink;
};

export function ContentNavigationLink(props: ContentNavigationLinkProps) {
  const { className, node, ...restProps } = props;
  const isDeprecated = node.badge?.variant === 'deprecated';
  const ref = useRef<HTMLAnchorElement>(null);
  const initialPathname = useLocation({
    select: (location) => location.pathname,
  });
  const isActiveOnMountRef = useRef(initialPathname === node.href);

  useEffect(() => {
    if (isActiveOnMountRef.current) {
      ref.current?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, []);

  return (
    <Box
      {...restProps}
      activeOptions={{
        exact: true,
      }}
      as={Link}
      className={[
        styles.ContentNavigationLink,
        className,
      ]}
      data-deprecated={isDeprecated}
      ref={ref}
      to={node.href}
    >
      {node.label}
    </Box>
  );
}
