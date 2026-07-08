import type { SidebarNodeNavigationNodeGroupProps } from './sidebar-node-navigation-node-group';

import { useLocation } from '@tanstack/react-router';

import { getSidebarNodeKey } from '#lib/sidebar-node-key';
import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import { SidebarNodeNavigationNode } from './sidebar-node-navigation-node';
import styles from './sidebar-node-navigation-node-group.module.css';

export function SidebarNodeNavigationNodeGroupStatic(
  props: SidebarNodeNavigationNodeGroupProps,
) {
  const { className, depth, sidebarNode, ...restProps } = props;
  const location = useLocation();
  const isActive =
    sidebarNode.href !== undefined && location.pathname === sidebarNode.href;

  return (
    <Box
      {...restProps}
      className={[
        styles.SidebarNodeNavigationNodeGroup,
        className,
      ]}
      data-depth={depth}
      data-kind="group"
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
            key={getSidebarNodeKey(child)}
          >
            <SidebarNodeNavigationNode
              depth={depth + 1}
              sidebarNode={child}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
