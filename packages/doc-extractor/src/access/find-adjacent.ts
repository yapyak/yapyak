import type { AdjacentPages } from '../types/access.ts';
import type { Manifest, SidebarLink, SidebarNode } from '../types/manifest.ts';

export function findAdjacent(
  manifest: Manifest,
  collection: string,
  href: string,
): AdjacentPages {
  const sidebar = manifest.collections[collection]?.sidebar ?? [];
  const flat = flattenLinks(sidebar);
  const index = flat.findIndex((link) => link.href === href);
  if (index === -1) {
    return { next: null, previous: null };
  }
  return {
    next: index < flat.length - 1 ? (flat[index + 1] ?? null) : null,
    previous: index > 0 ? (flat[index - 1] ?? null) : null,
  };
}

function flattenLinks(nodes: SidebarNode[]): SidebarLink[] {
  const result: SidebarLink[] = [];
  for (const node of nodes) {
    if (node.type === 'link') {
      result.push(node);
    } else {
      result.push(...flattenLinks(node.children));
    }
  }
  return result;
}
