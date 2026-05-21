import type { AdjacentPages } from '../types/access.ts';
import type {
  Manifest,
  Page,
  SidebarLink,
  SidebarNode,
} from '../types/manifest.ts';

export function findAdjacentPages(
  manifest: Manifest,
  collection: string,
  href: string,
): AdjacentPages {
  const collectionData = manifest.collections[collection];
  if (collectionData === undefined) {
    return { next: null, previous: null };
  }
  const flat = flattenLinks(collectionData.sidebar);
  const index = flat.findIndex((link) => link.href === href);
  if (index === -1) {
    return { next: null, previous: null };
  }
  const previousLink = index > 0 ? flat[index - 1] : undefined;
  const nextLink = index < flat.length - 1 ? flat[index + 1] : undefined;
  return {
    next:
      nextLink === undefined ? null : findPageByHref(manifest, nextLink.href),
    previous:
      previousLink === undefined
        ? null
        : findPageByHref(manifest, previousLink.href),
  };
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
