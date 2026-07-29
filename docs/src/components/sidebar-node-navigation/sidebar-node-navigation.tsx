import type { SidebarNode } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './sidebar-node-navigation.module.css';
import { SidebarNodeNavigationNode } from './sidebar-node-navigation-node';

export type SidebarNodeNavigationProps = BoxProps<'nav'> & {
  sidebarNodes: SidebarNode[];
};

export function SidebarNodeNavigation(props: SidebarNodeNavigationProps) {
  const { className, sidebarNodes, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="nav"
      className={[
        styles.SidebarNodeNavigation,
        className,
      ]}
    >
      {sidebarNodes.map((sidebarNode, index) => (
        <SidebarNodeNavigationNode
          key={index}
          sidebarNode={sidebarNode}
        />
      ))}
    </Box>
  );
}
