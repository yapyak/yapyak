import type { SidebarNode } from './types';

import { buildGuideSidebar } from './sidebar.server';

export interface GuideAdjacent {
  href: string;
  title: string;
}

export async function loadGuidePrevNext(slug: string) {
  const tree = await buildGuideSidebar(process.cwd());
  const flat = flattenLinks(tree);
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
