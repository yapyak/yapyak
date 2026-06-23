import type { Manifest, Page, SidebarLink, SidebarNode } from '../build';

export type AdjacentPages = {
  nextPage?: Page;
  nextParentLabel?: string;
  previousPage?: Page;
  previousParentLabel?: string;
};

type FlatEntry = {
  link: SidebarLink;
  parentLabel?: string;
};

export type PageEntry = {
  collection: string;
  page: Page;
  path: string;
};

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
  const index = flat.findIndex((entry) => entry.link.href === page.href);
  if (index === -1) {
    return {};
  }
  const previousEntry = index > 0 ? flat[index - 1] : undefined;
  const nextEntry = index < flat.length - 1 ? flat[index + 1] : undefined;
  const result: AdjacentPages = {};
  if (nextEntry) {
    const nextPage = findPageByHref(manifest, nextEntry.link.href);
    if (nextPage) {
      result.nextPage = nextPage;
      result.nextParentLabel = nextEntry.parentLabel;
    }
  }
  if (previousEntry) {
    const previousPage = findPageByHref(manifest, previousEntry.link.href);
    if (previousPage) {
      result.previousPage = previousPage;
      result.previousParentLabel = previousEntry.parentLabel;
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

function flattenLinks(nodes: SidebarNode[], parentLabel?: string): FlatEntry[] {
  const result: FlatEntry[] = [];
  for (const node of nodes) {
    if (node.type === 'link') {
      result.push({
        link: node,
        parentLabel,
      });
    } else {
      if (node.href !== undefined) {
        result.push({
          link: {
            badge: node.badge,
            href: node.href,
            label: node.label,
            type: 'link',
          },
          parentLabel,
        });
      }
      result.push(...flattenLinks(node.children, node.label));
    }
  }
  return result;
}
