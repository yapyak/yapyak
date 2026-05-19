import type { ApiManifest, ApiModule } from './types';
import type { NavNode } from '#lib/navigation';

import { loadManifest } from './manifest.server';

export async function loadReferenceSidebar() {
  const manifest = await loadManifest(process.cwd());
  return buildReferenceSidebar(manifest);
}

export function buildReferenceSidebar(manifest: ApiManifest): NavNode[] {
  const byId = new Map<string, ApiModule>();
  for (const module of manifest.modules) {
    byId.set(module.id, module);
  }
  const childrenById = new Map<string, ApiModule[]>();
  for (const id of byId.keys()) {
    const parentId = findParentId(id, byId);
    if (parentId === null) {
      continue;
    }
    let list = childrenById.get(parentId);
    if (list === undefined) {
      list = [];
      childrenById.set(parentId, list);
    }
    const module = byId.get(id);
    if (module !== undefined) {
      list.push(module);
    }
  }

  const root = byId.get('yapyak');
  if (root === undefined) {
    return [];
  }
  return moduleChildren(root, byId, childrenById);
}

function moduleChildren(
  module: ApiModule,
  byId: Map<string, ApiModule>,
  childrenById: Map<string, ApiModule[]>,
): NavNode[] {
  const nodes: NavNode[] = [];
  for (const api of module.exports) {
    nodes.push({
      badge: api.deprecated !== null ? { variant: 'deprecated' } : undefined,
      href: symbolHref(module.id, api.name),
      label: api.name,
      type: 'link',
    });
  }
  const subModules = (childrenById.get(module.id) ?? []).slice().sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  for (const child of subModules) {
    nodes.push({
      children: moduleChildren(child, byId, childrenById),
      collapsible: true,
      label: lastSegment(child.id),
      type: 'group',
    });
  }
  return nodes;
}

function findParentId(id: string, byId: Map<string, ApiModule>) {
  let cursor = id;
  while (true) {
    const slashIndex = cursor.lastIndexOf('/');
    if (slashIndex === -1) {
      return null;
    }
    cursor = cursor.slice(0, slashIndex);
    if (byId.has(cursor)) {
      return cursor;
    }
  }
}

function symbolHref(moduleId: string, name: string) {
  const slug = moduleSlug(moduleId);
  return slug === 'yapyak' ? `/reference/${name}` : `/reference/${slug}/${name}`;
}

function lastSegment(id: string) {
  const slashIndex = id.lastIndexOf('/');
  return slashIndex === -1 ? id : id.slice(slashIndex + 1);
}

export function moduleSlug(id: string) {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}
