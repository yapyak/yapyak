import type { SidebarNodeNavigationGroupProps } from './sidebar-node-navigation-group';

import { useLocation } from '@tanstack/react-router';

import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import { getKey, renderChild } from './sidebar-node-navigation-group';
import styles from './sidebar-node-navigation-group.module.css';

export function SidebarNodeNavigationGroupStatic(
  props: SidebarNodeNavigationGroupProps,
) {
  const { className, depth, sidebarNode, ...restProps } = props;
  const location = useLocation();
  const isActive =
    sidebarNode.href !== undefined && location.pathname === sidebarNode.href;

  return (
    <Box
      {...restProps}
      className={[
        styles.SidebarNodeNavigationGroup,
        className,
      ]}
      data-depth={depth}
    >
      {sidebarNode.href === undefined ? (
        <Box
          as="h3"
          className={styles.TitleHeading}
        >
          {sidebarNode.label}
        </Box>
      ) : (
        <LinkBase
          className={styles.TitleLink}
          data-active={isActive}
          to={sidebarNode.href}
        >
          {sidebarNode.label}
        </LinkBase>
      )}
      <Box
        as="ul"
        className={styles.List}
      >
        {sidebarNode.children.map((child) => (
          <Box
            as="li"
            key={getKey(child)}
          >
            {renderChild(child, depth + 1)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
