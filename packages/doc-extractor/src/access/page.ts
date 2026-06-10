import type { Manifest, Page, SidebarLink, SidebarNode } from '../build';

export interface AdjacentPages {
  nextPage?: Page;
  previousPage?: Page;
}

export interface PageEntry {
  collection: string;
  page: Page;
  path: string;
}

export function getPage(
  manifest: Manifest,
  collection: string,
  path = '',
): Page | undefined {
  return manifest.collections[collection]?.pages[path];
}

export function getFirstPage(
  manifest: Manifest,
  collection: string,
): Page | undefined {
  const collectionData = manifest.collections[collection];
  if (!collectionData) {
    return undefined;
  }
  const firstHref = findFirstHref(collectionData.sidebar);
  if (firstHref === undefined) {
    return undefined;
  }
  for (const page of Object.values(collectionData.pages)) {
    if (page.href === firstHref) {
      return page;
    }
  }
  return undefined;
}

export function* getAllPages(manifest: Manifest): Iterable<PageEntry> {
  for (const [collection, collectionData] of Object.entries(
    manifest.collections,
  )) {
    for (const [path, page] of Object.entries(collectionData.pages)) {
      yield { collection, page, path };
    }
  }
}

export function findAdjacentPages(
  manifest: Manifest,
  page: Page,
): AdjacentPages {
  const collection = collectionFromHref(page.href);
  if (collection === undefined) {
    return {};
  }
  const collectionData = manifest.collections[collection];
  if (!collectionData) {
    return {};
  }
  const flat = flattenLinks(collectionData.sidebar);
  const index = flat.findIndex((link) => link.href === page.href);
  if (index === -1) {
    return {};
  }
  const previousLink = index > 0 ? flat[index - 1] : undefined;
  const nextLink = index < flat.length - 1 ? flat[index + 1] : undefined;
  const result: AdjacentPages = {};
  if (nextLink) {
    const nextPage = findPageByHref(manifest, nextLink.href);
    if (nextPage) {
      result.nextPage = nextPage;
    }
  }
  if (previousLink) {
    const previousPage = findPageByHref(manifest, previousLink.href);
    if (previousPage) {
      result.previousPage = previousPage;
    }
  }
  return result;
}

function findFirstHref(nodes: SidebarNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'link') {
      return node.href;
    }
    if (node.href) {
      return node.href;
    }
    const nested = findFirstHref(node.children);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}

function collectionFromHref(href: string): string | undefined {
  const match = href.match(/^\/([^/]+)(?:\/|$)/);
  return match?.[1];
}

function findPageByHref(manifest: Manifest, href: string): Page | undefined {
  for (const collection of Object.values(manifest.collections)) {
    for (const page of Object.values(collection.pages)) {
      if (page.href === href) {
        return page;
      }
    }
  }
  return undefined;
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
