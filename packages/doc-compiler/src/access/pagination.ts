import type { NavigationManifest, PageMeta, SidebarNode } from '../build';

export type Pagination = {
  previousPageMeta: PageMeta | null;
  nextPageMeta: PageMeta | null;
};

export function getPagination(
  manifest: NavigationManifest,
  pageMeta: PageMeta,
): Pagination {
  const collectionName = collectionFromHref(pageMeta.href);
  if (collectionName === undefined) {
    return {
      nextPageMeta: null,
      previousPageMeta: null,
    };
  }
  const collection = manifest.collections[collectionName];
  if (!collection) {
    return {
      nextPageMeta: null,
      previousPageMeta: null,
    };
  }
  const hrefs = flattenLinks(collection.sidebarNodes);
  const index = hrefs.indexOf(pageMeta.href);
  if (index === -1) {
    return {
      nextPageMeta: null,
      previousPageMeta: null,
    };
  }
  return {
    nextPageMeta: pageMetaAt(manifest, hrefs, index + 1),
    previousPageMeta: pageMetaAt(manifest, hrefs, index - 1),
  };
}

function pageMetaAt(
  manifest: NavigationManifest,
  hrefs: string[],
  index: number,
): PageMeta | null {
  const href = hrefs[index];
  if (href === undefined) {
    return null;
  }
  return findPageByHref(manifest, href) ?? null;
}

function collectionFromHref(href: string): string | undefined {
  const match = href.match(/^\/([^/]+)(?:\/|$)/);
  return match?.[1];
}

function findPageByHref(
  manifest: NavigationManifest,
  href: string,
): PageMeta | undefined {
  for (const collection of Object.values(manifest.collections)) {
    for (const pageMeta of Object.values(collection.pages)) {
      if (pageMeta.href === href) {
        return pageMeta;
      }
    }
  }
  return undefined;
}

function flattenLinks(sidebarNodes: SidebarNode[]): string[] {
  const hrefs: string[] = [];
  for (const sidebarNode of sidebarNodes) {
    if (sidebarNode.kind === 'link') {
      hrefs.push(sidebarNode.href);
    } else {
      if (sidebarNode.href !== undefined) {
        hrefs.push(sidebarNode.href);
      }
      hrefs.push(...flattenLinks(sidebarNode.children));
    }
  }
  return hrefs;
}
