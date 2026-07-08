import type {
  PackageContext,
  ReferenceExport,
  ReferenceManifest,
  ReferenceModule,
} from '../extract/typescript';
import type { SidebarNode } from './manifest';

import { expandModuleEntries } from '../extract/typescript';
import { buildSymbolHref } from '../symbol-path';

type BuildPackageRootInput = {
  collapsible: boolean;
  expanded: boolean;
  label: string;
};

export function buildPackageRoot(
  manifest: ReferenceManifest,
  context: PackageContext,
  input: BuildPackageRootInput,
): SidebarNode {
  const { collectionName, packageName, packageSlug } = context;
  const { collapsible, expanded, label } = input;
  const modulesById = new Map<string, ReferenceModule>();
  for (const module of manifest.modules) {
    modulesById.set(module.id, module);
  }
  const childrenByParentId = new Map<string, ReferenceModule[]>();
  for (const id of modulesById.keys()) {
    const parentId = findParentId(id, modulesById);
    if (parentId === undefined) {
      continue;
    }
    let list = childrenByParentId.get(parentId);
    if (list === undefined) {
      list = [];
      childrenByParentId.set(parentId, list);
    }
    const module = modulesById.get(id);
    if (module !== undefined) {
      list.push(module);
    }
  }

  const root = modulesById.get(packageName);
  const children =
    root === undefined
      ? topLevelSubpathChildren(modulesById, childrenByParentId, context)
      : moduleChildren(root, modulesById, childrenByParentId, context);

  return {
    children,
    collapsible,
    href: `/${collectionName}/${packageSlug}`,
    kind: 'group',
    label,
    ...(collapsible && {
      defaultOpen: expanded,
    }),
  };
}

function moduleChildren(
  module: ReferenceModule,
  modulesById: Map<string, ReferenceModule>,
  childrenByParentId: Map<string, ReferenceModule[]>,
  context: PackageContext,
): SidebarNode[] {
  const { collectionName, packageName, packageSlug } = context;
  const exportsByName = new Map<string, ReferenceExport>();
  for (const symbol of module.exports) {
    exportsByName.set(symbol.name, symbol);
  }
  const sidebarNodes: SidebarNode[] = [];
  const entries = expandModuleEntries(module.exports);
  for (const entry of entries) {
    const parentName = entry.segment.split('.')[0] ?? entry.segment;
    const parentSymbol = exportsByName.get(parentName);
    sidebarNodes.push({
      href: buildSymbolHref(module.id, entry.segment, {
        collectionName,
        packageName,
        packageSlug,
      }),
      label: entry.label,
      ...(parentSymbol?.deprecated != null && {
        badge: {
          variant: 'deprecated' as const,
        },
      }),
      kind: 'link',
    });
  }
  const subModules = (childrenByParentId.get(module.id) ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const child of subModules) {
    const childSlug = child.id.slice(packageName.length + 1);
    sidebarNodes.push({
      children: moduleChildren(child, modulesById, childrenByParentId, context),
      collapsible: true,
      href: `/${collectionName}/${packageSlug}/${childSlug}`,
      kind: 'group',
      label: lastSegment(child.id),
    });
  }
  return sidebarNodes;
}

function topLevelSubpathChildren(
  modulesById: Map<string, ReferenceModule>,
  childrenByParentId: Map<string, ReferenceModule[]>,
  context: PackageContext,
): SidebarNode[] {
  const { collectionName, packageName, packageSlug } = context;
  const prefix = `${packageName}/`;
  const topLevel: ReferenceModule[] = [];
  for (const module of modulesById.values()) {
    if (!module.id.startsWith(prefix)) {
      continue;
    }
    const tail = module.id.slice(prefix.length);
    if (tail.includes('/')) {
      continue;
    }
    topLevel.push(module);
  }
  topLevel.sort((a, b) => a.id.localeCompare(b.id));
  return topLevel.map((child) => ({
    children: moduleChildren(child, modulesById, childrenByParentId, context),
    collapsible: true,
    href: `/${collectionName}/${packageSlug}/${child.id.slice(prefix.length)}`,
    kind: 'group',
    label: lastSegment(child.id),
  }));
}

function findParentId(
  id: string,
  modulesById: Map<string, ReferenceModule>,
): string | undefined {
  let cursor = id;
  while (true) {
    const slashIndex = cursor.lastIndexOf('/');
    if (slashIndex === -1) {
      return undefined;
    }
    cursor = cursor.slice(0, slashIndex);
    if (modulesById.has(cursor)) {
      return cursor;
    }
  }
}

function lastSegment(id: string): string {
  const slashIndex = id.lastIndexOf('/');
  if (slashIndex === -1) {
    return id;
  }
  return id.slice(slashIndex + 1);
}
