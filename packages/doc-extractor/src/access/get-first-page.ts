import type { Manifest, Page, SidebarNode } from '../types/manifest.ts';

export function getFirstPage(
  manifest: Manifest,
  collection: string,
): Page | null {
  const collectionData = manifest.collections[collection];
  if (collectionData === undefined) {
    return null;
  }
  const firstHref = findFirstHref(collectionData.sidebar);
  if (firstHref === null) {
    return null;
  }
  for (const page of Object.values(collectionData.pages)) {
    if (page.href === firstHref) {
      return page;
    }
  }
  return null;
}

function findFirstHref(nodes: SidebarNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'link') {
      return node.href;
    }
    if (node.href !== undefined) {
      return node.href;
    }
    const nested = findFirstHref(node.children);
    if (nested !== null) {
      return nested;
    }
  }
  return null;
}
