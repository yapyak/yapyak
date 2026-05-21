import type { AdjacentPages } from '../types/access.ts';
import type {
  Manifest,
  Page,
  SidebarLink,
  SidebarNode,
} from '../types/manifest.ts';

export function findAdjacentPages(
  manifest: Manifest,
  page: Page,
): AdjacentPages {
  const collection = collectionFromHref(page.href);
  if (collection === null) {
    return { nextPage: null, previousPage: null };
  }
  const collectionData = manifest.collections[collection];
  if (collectionData === undefined) {
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
    nextPage:
      nextLink === undefined ? null : findPageByHref(manifest, nextLink.href),
    previousPage:
      previousLink === undefined
        ? null
        : findPageByHref(manifest, previousLink.href),
  };
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
