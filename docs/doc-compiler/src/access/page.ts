import type { NavigationManifest, Page, SidebarNode } from '../build';

export type PageEntry = {
  collectionName: string;
  page: Page;
  path: string;
};

export function getPage(
  manifest: NavigationManifest,
  collectionName: string,
  path = '',
): Page | undefined {
  return manifest.collections[collectionName]?.pages[path];
}

export function getFirstPage(
  manifest: NavigationManifest,
  collectionName: string,
): Page | undefined {
  const collection = manifest.collections[collectionName];
  if (!collection) {
    return undefined;
  }
  const firstHref = findFirstHref(collection.sidebarNodes);
  if (firstHref === undefined) {
    return undefined;
  }
  for (const page of Object.values(collection.pages)) {
    if (page.href === firstHref) {
      return page;
    }
  }
  return undefined;
}

function findFirstHref(sidebarNodes: SidebarNode[]): string | undefined {
  for (const sidebarNode of sidebarNodes) {
    if (sidebarNode.kind === 'link') {
      return sidebarNode.href;
    }
    if (sidebarNode.href !== undefined) {
      return sidebarNode.href;
    }
    const nested = findFirstHref(sidebarNode.children);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}
