import type { SidebarGroup, SidebarNode } from '@yapyak/doc-compiler';
import type { ReactNode } from 'react';
import type { BoxProps } from '#primitives/box';

import { ContentNavigationGroupCollapsible } from './content-navigation-group-collapsible';
import { ContentNavigationGroupStatic } from './content-navigation-group-static';
import { ContentNavigationLink } from './content-navigation-link';

export type ContentNavigationGroupProps = BoxProps & {
  depth: number;
  node: SidebarGroup;
};

export function ContentNavigationGroup(props: ContentNavigationGroupProps) {
  if (props.node.collapsible) {
    return <ContentNavigationGroupCollapsible {...props} />;
  }
  return <ContentNavigationGroupStatic {...props} />;
}

export function renderChild(child: SidebarNode, depth: number): ReactNode {
  if (child.kind === 'group') {
    return (
      <ContentNavigationGroup
        depth={depth}
        node={child}
      />
    );
  }
  return <ContentNavigationLink node={child} />;
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
