import type { SidebarGroupNode, SidebarNode } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { SidebarNodeNavigationGroupCollapsible } from './sidebar-node-navigation-group-collapsible';
import { SidebarNodeNavigationGroupStatic } from './sidebar-node-navigation-group-static';
import { SidebarNodeNavigationLink } from './sidebar-node-navigation-link';

export type SidebarNodeNavigationGroupProps = BoxProps & {
  depth: number;
  node: SidebarGroupNode;
};

export function SidebarNodeNavigationGroup(
  props: SidebarNodeNavigationGroupProps,
) {
  if (props.node.collapsible) {
    return <SidebarNodeNavigationGroupCollapsible {...props} />;
  }
  return <SidebarNodeNavigationGroupStatic {...props} />;
}

export function renderChild(child: SidebarNode, depth: number) {
  if (child.kind === 'group') {
    return (
      <SidebarNodeNavigationGroup
        depth={depth}
        node={child}
      />
    );
  }
  return <SidebarNodeNavigationLink node={child} />;
}

export function getKey(node: SidebarNode): string {
  if (node.kind === 'link') {
    return node.href;
  }
  return `group:${node.label}`;
}

export function childrenContainPath(
  nodes: SidebarNode[],
  pathname: string,
): boolean {
  for (const node of nodes) {
    if (node.kind === 'link' && pathname.startsWith(node.href)) {
      return true;
    }
    if (node.kind === 'group' && childrenContainPath(node.children, pathname)) {
      return true;
    }
  }
  return false;
}
