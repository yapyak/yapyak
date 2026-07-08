import type { SidebarGroupNode, SidebarNode } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { SidebarNodeNavigationGroupCollapsible } from './sidebar-node-navigation-group-collapsible';
import { SidebarNodeNavigationGroupStatic } from './sidebar-node-navigation-group-static';
import { SidebarNodeNavigationLink } from './sidebar-node-navigation-link';

export type SidebarNodeNavigationGroupProps = BoxProps & {
  depth: number;
  sidebarNode: SidebarGroupNode;
};

export function SidebarNodeNavigationGroup(
  props: SidebarNodeNavigationGroupProps,
) {
  if (props.sidebarNode.collapsible) {
    return <SidebarNodeNavigationGroupCollapsible {...props} />;
  }
  return <SidebarNodeNavigationGroupStatic {...props} />;
}

export function renderChild(child: SidebarNode, depth: number) {
  if (child.kind === 'group') {
    return (
      <SidebarNodeNavigationGroup
        depth={depth}
        sidebarNode={child}
      />
    );
  }
  return <SidebarNodeNavigationLink sidebarNode={child} />;
}

export function getKey(sidebarNode: SidebarNode): string {
  if (sidebarNode.kind === 'link') {
    return sidebarNode.href;
  }
  return `group:${sidebarNode.label}`;
}

export function childrenContainPath(
  sidebarNodes: SidebarNode[],
  pathname: string,
): boolean {
  for (const sidebarNode of sidebarNodes) {
    if (sidebarNode.kind === 'link' && pathname.startsWith(sidebarNode.href)) {
      return true;
    }
    if (
      sidebarNode.kind === 'group' &&
      childrenContainPath(sidebarNode.children, pathname)
    ) {
      return true;
    }
  }
  return false;
}
