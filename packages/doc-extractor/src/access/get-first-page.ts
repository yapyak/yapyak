import type {
  Manifest,
  Page,
  SidebarLink,
  SidebarNode,
} from '../types/manifest.ts';

export function getFirstPage(
  manifest: Manifest,
  collection: string,
): Page | null {
  const collectionData = manifest.collections[collection];
  if (collectionData === undefined) {
    return null;
  }
  const firstLink = findFirstLink(collectionData.sidebar);
  if (firstLink === null) {
    return null;
  }
  for (const page of Object.values(collectionData.pages)) {
    if (page.href === firstLink.href) {
      return page;
    }
  }
  return null;
}

function findFirstLink(nodes: SidebarNode[]): SidebarLink | null {
  for (const node of nodes) {
    if (node.type === 'link') {
      return node;
    }
    const found = findFirstLink(node.children);
    if (found !== null) {
      return found;
    }
  }
  return null;
}
