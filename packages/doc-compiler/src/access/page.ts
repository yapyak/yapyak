import type {
  NavigationManifest,
  PageMeta,
  SidebarLink,
  SidebarNode,
} from '../build';

export type AdjacentPages = {
  nextPage?: PageMeta;
  nextParentLabel?: string;
  previousPage?: PageMeta;
  previousParentLabel?: string;
};

type FlatEntry = {
  link: SidebarLink;
  parentLabel?: string;
};

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

export function getFirstPage(
  manifest: NavigationManifest,
  collectionName: string,
): PageMeta | undefined {
  const collection = manifest.collections[collectionName];
  if (!collection) {
    return undefined;
  }
  const firstHref = findFirstHref(collection.sidebar);
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

export function findAdjacentPages(
  manifest: NavigationManifest,
  page: PageMeta,
): AdjacentPages {
  const collectionName = collectionFromHref(page.href);
  if (collectionName === undefined) {
    return {};
  }
  const collection = manifest.collections[collectionName];
  if (!collection) {
    return {};
  }
  const flat = flattenLinks(collection.sidebar);
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
    if (node.kind === 'link') {
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

function findPageByHref(
  manifest: NavigationManifest,
  href: string,
): PageMeta | undefined {
  for (const collectionName of Object.values(manifest.collections)) {
    for (const page of Object.values(collectionName.pages)) {
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
    if (node.kind === 'link') {
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
            kind: 'link',
            label: node.label,
          },
          parentLabel,
        });
      }
      result.push(...flattenLinks(node.children, node.label));
    }
  }
  return result;
}
