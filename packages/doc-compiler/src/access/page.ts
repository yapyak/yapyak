import type {
  NavigationManifest,
  PageMeta,
  SidebarLinkNode,
  SidebarNode,
} from '../build';

export type AdjacentPages = {
  nextPage?: PageMeta;
  nextParentLabel?: string;
  previousPage?: PageMeta;
  previousParentLabel?: string;
};

type FlatEntry = {
  sidebarNode: SidebarLinkNode;
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

export function getAdjacentPages(
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
  const flat = flattenLinks(collection.sidebarNodes);
  const index = flat.findIndex((entry) => entry.sidebarNode.href === page.href);
  if (index === -1) {
    return {};
  }
  const previousEntry = index > 0 ? flat[index - 1] : undefined;
  const nextEntry = index < flat.length - 1 ? flat[index + 1] : undefined;
  const result: AdjacentPages = {};
  if (nextEntry) {
    const nextPage = findPageByHref(manifest, nextEntry.sidebarNode.href);
    if (nextPage) {
      result.nextPage = nextPage;
      result.nextParentLabel = nextEntry.parentLabel;
    }
  }
  if (previousEntry) {
    const previousPage = findPageByHref(
      manifest,
      previousEntry.sidebarNode.href,
    );
    if (previousPage) {
      result.previousPage = previousPage;
      result.previousParentLabel = previousEntry.parentLabel;
    }
  }
  return result;
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

function flattenLinks(
  sidebarNodes: SidebarNode[],
  parentLabel?: string,
): FlatEntry[] {
  const result: FlatEntry[] = [];
  for (const sidebarNode of sidebarNodes) {
    if (sidebarNode.kind === 'link') {
      result.push({
        parentLabel,
        sidebarNode,
      });
    } else {
      if (sidebarNode.href !== undefined) {
        result.push({
          parentLabel,
          sidebarNode: {
            badge: sidebarNode.badge,
            href: sidebarNode.href,
            kind: 'link',
            label: sidebarNode.label,
          },
        });
      }
      result.push(...flattenLinks(sidebarNode.children, sidebarNode.label));
    }
  }
  return result;
}
