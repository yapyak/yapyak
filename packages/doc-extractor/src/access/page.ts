import type {
  Manifest,
  Page,
  SidebarLink,
  SidebarNode,
} from '../build/manifest';

export interface AdjacentPages {
  nextPage: Page | null;
  previousPage: Page | null;
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
): Page | null {
  return manifest.collections[collection]?.pages[path] ?? null;
}

export function getFirstPage(
  manifest: Manifest,
  collection: string,
): Page | null {
  const collectionData = manifest.collections[collection];
  if (!collectionData) {
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
  if (collection === null) {
    return { nextPage: null, previousPage: null };
  }
  const collectionData = manifest.collections[collection];
  if (!collectionData) {
    return { nextPage: null, previousPage: null };
  }
  const flat = flattenLinks(collectionData.sidebar);
  const index = flat.findIndex((link) => link.href === page.href);
  if (index === -1) {
    return { nextPage: null, previousPage: null };
  }
  const previousLink = index > 0 ? flat[index - 1] : undefined;
  const nextLink = index < flat.length - 1 ? flat[index + 1] : undefined;
  return {
    nextPage: nextLink ? findPageByHref(manifest, nextLink.href) : null,
    previousPage: previousLink
      ? findPageByHref(manifest, previousLink.href)
      : null,
  };
}

function findFirstHref(nodes: SidebarNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'link') {
      return node.href;
    }
    if (node.href) {
      return node.href;
    }
    const nested = findFirstHref(node.children);
    if (nested !== null) {
      return nested;
    }
  }
  return null;
}

function collectionFromHref(href: string): string | null {
  const match = href.match(/^\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
}

function findPageByHref(manifest: Manifest, href: string): Page | null {
  for (const collection of Object.values(manifest.collections)) {
    for (const page of Object.values(collection.pages)) {
      if (page.href === href) {
        return page;
      }
    }
  }
  return null;
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
