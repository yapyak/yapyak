import type { SidebarGroupNode } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { SidebarNodeNavigationNodeGroupCollapsible } from './sidebar-node-navigation-node-group-collapsible';
import { SidebarNodeNavigationNodeGroupStatic } from './sidebar-node-navigation-node-group-static';

export type SidebarNodeNavigationNodeGroupProps = BoxProps & {
  depth: number;
  sidebarNode: SidebarGroupNode;
};

export function SidebarNodeNavigationNodeGroup(
  props: SidebarNodeNavigationNodeGroupProps,
) {
  switch (props.sidebarNode.collapsible) {
    case true:
      return <SidebarNodeNavigationNodeGroupCollapsible {...props} />;
    case false:
      return <SidebarNodeNavigationNodeGroupStatic {...props} />;
    default:
      return null;
  }
}
