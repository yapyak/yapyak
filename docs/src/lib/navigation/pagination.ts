import type { NavAdjacent, NavNode, NavPagination } from './types';

export function findAdjacent(tree: NavNode[], href: string): NavPagination {
  const flat = flattenLinks(tree);
  const index = flat.findIndex((link) => link.href === href);
  if (index === -1) {
    return { next: null, previous: null };
  }
  return {
    next: index < flat.length - 1 ? (flat[index + 1] ?? null) : null,
    previous: index > 0 ? (flat[index - 1] ?? null) : null,
  };
}

function flattenLinks(nodes: NavNode[]): NavAdjacent[] {
  const result: NavAdjacent[] = [];
  for (const node of nodes) {
    if (node.type === 'link') {
      result.push({ href: node.href, label: node.label });
    } else {
      result.push(...flattenLinks(node.children));
    }
  }
  return result;
}
