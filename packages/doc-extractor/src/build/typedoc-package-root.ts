import type { PackageContext } from '../extract/typedoc';
import type {
  ReferenceManifest,
  ReferenceModule,
} from '../extract/typedoc/type';
import type { SidebarNode } from './manifest';

import { buildSymbolHref } from '../symbol-path';

type BuildTypedocPackageRootInput = {
  collapsible: boolean;
  expanded: boolean;
  label: string;
};

export function buildTypedocPackageRoot(
  manifest: ReferenceManifest,
  context: PackageContext,
  input: BuildTypedocPackageRootInput,
): SidebarNode {
  const { collectionName, packageName, packageSlug } = context;
  const { collapsible, expanded, label } = input;
  const byId = new Map<string, ReferenceModule>();
  for (const module of manifest.modules) {
    byId.set(module.id, module);
  }
  const childrenById = new Map<string, ReferenceModule[]>();
  for (const id of byId.keys()) {
    const parentId = findParentId(id, byId);
    if (parentId === undefined) {
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
    ? moduleChildren(root, byId, childrenById, context)
    : topLevelSubpathChildren(byId, childrenById, context);

  return {
    children,
    collapsible,
    href: `/${collectionName}/${packageSlug}`,
    label,
    type: 'group',
    ...(collapsible && {
      defaultOpen: expanded,
    }),
  };
}

function moduleChildren(
  module: ReferenceModule,
  byId: Map<string, ReferenceModule>,
  childrenById: Map<string, ReferenceModule[]>,
  context: PackageContext,
): SidebarNode[] {
  const { collectionName, packageName, packageSlug } = context;
  const nodes: SidebarNode[] = [];
  for (const api of module.exports) {
    nodes.push({
      href: buildSymbolHref(module.id, api.name, {
        collectionName,
        packageName,
        packageSlug,
      }),
      label: api.kind === 'function' ? `${api.name}()` : api.name,
      ...(api.deprecated !== null && {
        badge: {
          variant: 'deprecated' as const,
        },
      }),
      type: 'link',
    });
  }
  const subModules = (childrenById.get(module.id) ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const child of subModules) {
    const childSlug = child.id.slice(packageName.length + 1);
    nodes.push({
      children: moduleChildren(child, byId, childrenById, context),
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
  context: PackageContext,
): SidebarNode[] {
  const { collectionName, packageName, packageSlug } = context;
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
    children: moduleChildren(child, byId, childrenById, context),
    collapsible: true,
    href: `/${collectionName}/${packageSlug}/${child.id.slice(prefix.length)}`,
    label: lastSegment(child.id),
    type: 'group',
  }));
}

function findParentId(
  id: string,
  byId: Map<string, ReferenceModule>,
): string | undefined {
  let cursor = id;
  while (true) {
    const slashIndex = cursor.lastIndexOf('/');
    if (slashIndex === -1) {
      return undefined;
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
