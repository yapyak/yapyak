import type { SidebarNode } from '@yapyak/doc-compiler';

export function getSidebarNodeKey(sidebarNode: SidebarNode): string {
  if (sidebarNode.kind === 'link') {
    return sidebarNode.href;
  }
  return `group:${sidebarNode.label}`;
}
