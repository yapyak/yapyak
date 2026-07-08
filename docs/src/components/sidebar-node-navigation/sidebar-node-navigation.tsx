import type { SidebarNode } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './sidebar-node-navigation.module.css';
import { SidebarNodeNavigationGroup } from './sidebar-node-navigation-group';
import { SidebarNodeNavigationLink } from './sidebar-node-navigation-link';

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
      {sidebarNodes.map((sidebarNode) =>
        sidebarNode.kind === 'group' ? (
          <SidebarNodeNavigationGroup
            className={
              sidebarNode.collapsible
                ? styles.CollapsibleGroup
                : styles.StaticGroup
            }
            depth={0}
            key={`group:${sidebarNode.label}`}
            sidebarNode={sidebarNode}
          />
        ) : (
          <SidebarNodeNavigationLink
            className={styles.Link}
            key={sidebarNode.href}
            sidebarNode={sidebarNode}
          />
        ),
      )}
    </Box>
  );
}
