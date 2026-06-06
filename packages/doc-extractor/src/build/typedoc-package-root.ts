import type { SidebarNode } from '../build/manifest';
import type {
  ReferenceManifest,
  ReferenceModule,
} from '../extract/typedoc/type';

import { buildSymbolHref } from '../symbol-path';

interface BuildTypedocPackageRootOptions {
  collapsible: boolean;
  collectionName: string;
  expanded: boolean;
  label: string;
  packageName: string;
  packageSlug: string;
}

export function buildTypedocPackageRoot(
  manifest: ReferenceManifest,
  options: BuildTypedocPackageRootOptions,
): SidebarNode {
  const {
    collapsible,
    collectionName,
    expanded,
    label,
    packageName,
    packageSlug,
  } = options;
  const byId = new Map<string, ReferenceModule>();
  for (const module of manifest.modules) {
    byId.set(module.id, module);
  }
  const childrenById = new Map<string, ReferenceModule[]>();
  for (const id of byId.keys()) {
    const parentId = findParentId(id, byId);
    if (parentId === null) {
      continue;
    }
    let list = childrenById.get(parentId);
    if (!list) {
      list = [];
      childrenById.set(parentId, list);
    }
    const module = byId.get(id);
    if (module) {
      list.push(module);
    }
  }

  const root = byId.get(packageName);
  const children = root
    ? moduleChildren(
        root,
        byId,
        childrenById,
        collectionName,
        packageName,
        packageSlug,
      )
    : topLevelSubpathChildren(
        byId,
        childrenById,
        collectionName,
        packageName,
        packageSlug,
      );

  return {
    children,
    collapsible,
    defaultOpen: collapsible ? expanded : undefined,
    href: `/${collectionName}/${packageSlug}`,
    label,
    type: 'group',
  };
}

function moduleChildren(
  module: ReferenceModule,
  byId: Map<string, ReferenceModule>,
  childrenById: Map<string, ReferenceModule[]>,
  collectionName: string,
  packageName: string,
  packageSlug: string,
): SidebarNode[] {
  const nodes: SidebarNode[] = [];
  for (const api of module.exports) {
    nodes.push({
      badge: api.deprecated !== null ? { variant: 'deprecated' } : undefined,
      href: buildSymbolHref(
        module.id,
        api.name,
        collectionName,
        packageName,
        packageSlug,
      ),
      label: api.kind === 'function' ? `${api.name}()` : api.name,
      type: 'link',
    });
  }
  const subModules = (childrenById.get(module.id) ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const child of subModules) {
    const childSlug = child.id.slice(packageName.length + 1);
    nodes.push({
      children: moduleChildren(
        child,
        byId,
        childrenById,
        collectionName,
        packageName,
        packageSlug,
      ),
      collapsible: true,
      href: `/${collectionName}/${packageSlug}/${childSlug}`,
      label: lastSegment(child.id),
      type: 'group',
    });
  }
  return nodes;
}

function topLevelSubpathChildren(
  byId: Map<string, ReferenceModule>,
  childrenById: Map<string, ReferenceModule[]>,
  collectionName: string,
  packageName: string,
  packageSlug: string,
): SidebarNode[] {
  const prefix = `${packageName}/`;
  const tops: ReferenceModule[] = [];
  for (const module of byId.values()) {
    if (!module.id.startsWith(prefix)) {
      continue;
    }
    const tail = module.id.slice(prefix.length);
    if (tail.includes('/')) {
      continue;
    }
    tops.push(module);
  }
  tops.sort((a, b) => a.id.localeCompare(b.id));
  return tops.map((child) => ({
    children: moduleChildren(
      child,
      byId,
      childrenById,
      collectionName,
      packageName,
      packageSlug,
    ),
    collapsible: true,
    href: `/${collectionName}/${packageSlug}/${child.id.slice(prefix.length)}`,
    label: lastSegment(child.id),
    type: 'group',
  }));
}

function findParentId(id: string, byId: Map<string, ReferenceModule>) {
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

function lastSegment(id: string) {
  const slashIndex = id.lastIndexOf('/');
  return slashIndex === -1 ? id : id.slice(slashIndex + 1);
}
