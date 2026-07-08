import type { NavigationManifest, Page, SidebarNode } from '../build';

export type Pagination = {
  nextPage?: Page;
  previousPage?: Page;
};

export function getPagination(
  manifest: NavigationManifest,
  page: Page,
): Pagination {
  const collectionName = collectionFromHref(page.href);
  if (collectionName === undefined) {
    return {};
  }
  const collection = manifest.collections[collectionName];
  if (!collection) {
    return {};
  }
  const hrefs = flattenLinks(collection.sidebarNodes);
  const index = hrefs.indexOf(page.href);
  if (index === -1) {
    return {};
  }
  const result: Pagination = {};
  const previousPage = findPageAt(manifest, hrefs, index - 1);
  if (previousPage !== undefined) {
    result.previousPage = previousPage;
  }
  const nextPage = findPageAt(manifest, hrefs, index + 1);
  if (nextPage !== undefined) {
    result.nextPage = nextPage;
  }
  return result;
}

function findPageAt(
  manifest: NavigationManifest,
  hrefs: string[],
  index: number,
): Page | undefined {
  const href = hrefs[index];
  if (href === undefined) {
    return undefined;
  }
  return findPageByHref(manifest, href);
}

function collectionFromHref(href: string): string | undefined {
  const match = href.match(/^\/([^/]+)(?:\/|$)/);
  return match?.[1];
}

function findPageByHref(
  manifest: NavigationManifest,
  href: string,
): Page | undefined {
  for (const collection of Object.values(manifest.collections)) {
    for (const page of Object.values(collection.pages)) {
      if (page.href === href) {
        return page;
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
