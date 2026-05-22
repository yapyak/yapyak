import type { SidebarGroup, SidebarNode } from '@yapyak/doc-extractor';
import type { ReactNode } from 'react';
import type { BoxProps } from '#components/box';

import { ContentNavigationGroupCollapsible } from './group/collapsible';
import { ContentNavigationGroupStatic } from './group/static';
import { ContentNavigationLink } from './link';

export interface ContentNavigationGroupProps extends BoxProps {
  depth: number;
  node: SidebarGroup;
}

export function ContentNavigationGroup(props: ContentNavigationGroupProps) {
  if (props.node.collapsible) {
    return <ContentNavigationGroupCollapsible {...props} />;
  }
  return <ContentNavigationGroupStatic {...props} />;
}

export function renderChild(child: SidebarNode, depth: number): ReactNode {
  if (child.type === 'group') {
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
  if (node.type === 'link') {
    return node.href;
  }
  return `group:${node.label}`;
}

export function childrenContainPath(
  nodes: SidebarNode[],
  pathname: string,
): boolean {
  for (const node of nodes) {
    if (node.type === 'link' && pathname.startsWith(node.href)) {
      return true;
    }
    if (node.type === 'group' && childrenContainPath(node.children, pathname)) {
      return true;
    }
  }
  return false;
}
