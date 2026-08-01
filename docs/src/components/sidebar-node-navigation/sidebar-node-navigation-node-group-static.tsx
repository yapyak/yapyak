import type { SidebarNodeNavigationNodeGroupProps } from './sidebar-node-navigation-node-group';

import { useLocation } from '@tanstack/react-router';

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
      data-active={isActive}
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
          to={sidebarNode.href}
        >
          {sidebarNode.label}
        </LinkBase>
      )}
      <Box
        as="ul"
        className={styles.List}
      >
        {sidebarNode.children.map((child, index) => (
          <Box
            as="li"
            key={index}
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
