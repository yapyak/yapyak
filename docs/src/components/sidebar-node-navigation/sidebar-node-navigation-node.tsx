import type { SidebarNode } from '@yapyak/docs-compiler';

import { SidebarNodeNavigationNodeGroup } from './sidebar-node-navigation-node-group';
import { SidebarNodeNavigationNodeLink } from './sidebar-node-navigation-node-link';

export type SidebarNodeNavigationNodeProps = {
  depth?: number;
  sidebarNode: SidebarNode;
};

export function SidebarNodeNavigationNode(
  props: SidebarNodeNavigationNodeProps,
) {
  const { depth = 0, sidebarNode } = props;

  switch (sidebarNode.kind) {
    case 'group':
      return (
        <SidebarNodeNavigationNodeGroup
          depth={depth}
          sidebarNode={sidebarNode}
        />
      );
    case 'link':
      return <SidebarNodeNavigationNodeLink sidebarNode={sidebarNode} />;
    default:
      return null;
  }
}
