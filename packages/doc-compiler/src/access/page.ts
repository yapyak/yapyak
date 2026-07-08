import type { NavigationManifest, PageMeta, SidebarNode } from '../build';

export type PageEntry = {
  collectionName: string;
  page: PageMeta;
  path: string;
};

export function getPage(
  manifest: NavigationManifest,
  collectionName: string,
  path = '',
): PageMeta | undefined {
  return manifest.collections[collectionName]?.pages[path];
}

export function getFirstPageMeta(
  manifest: NavigationManifest,
  collectionName: string,
): PageMeta | undefined {
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
    if (sidebarNode.href) {
      return sidebarNode.href;
    }
    const nested = findFirstHref(sidebarNode.children);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}
