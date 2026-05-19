import type { SidebarNode } from './types';

export interface GuideAdjacent {
  href: string;
  title: string;
}

export interface GuidePagination {
  next: GuideAdjacent | null;
  previous: GuideAdjacent | null;
}

export function findAdjacentPages(
  sidebar: SidebarNode[],
  slug: string,
): GuidePagination {
  const flat = flattenLinks(sidebar);
  const currentHref = `/guide/${slug}`;
  const index = flat.findIndex((link) => link.href === currentHref);
  if (index === -1) {
    return { next: null, previous: null };
  }
  return {
    next: index < flat.length - 1 ? flat[index + 1] : null,
    previous: index > 0 ? flat[index - 1] : null,
  };
}

function flattenLinks(nodes: SidebarNode[]): GuideAdjacent[] {
  const result: GuideAdjacent[] = [];
  for (const node of nodes) {
    if (node.type === 'link') {
      result.push({ href: node.href, title: node.title });
    } else {
      result.push(...flattenLinks(node.items));
    }
  }
  return result;
}
