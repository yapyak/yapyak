import type {
  PackageContext,
  ReferenceExport,
  ReferenceManifest,
  ReferenceModule,
  TypeToken,
} from '../extract/typescript';
import type { SidebarNode } from './manifest';

import { buildSymbolHref } from '../symbol-path';

type BuildPackageRootInput = {
  collapsible: boolean;
  expanded: boolean;
  label: string;
};

type SidebarRow = {
  label: string;
  segment: string;
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
    label,
    type: 'group',
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
  const nodes: SidebarNode[] = [];
  for (const symbol of module.exports) {
    const rows = expandSidebarRows(symbol, exportsByName);
    for (const row of rows) {
      nodes.push({
        href: buildSymbolHref(module.id, row.segment, {
          collectionName,
          packageName,
          packageSlug,
        }),
        label: row.label,
        ...(symbol.deprecated !== null && {
          badge: {
            variant: 'deprecated' as const,
          },
        }),
        type: 'link',
      });
    }
  }
  const subModules = (childrenByParentId.get(module.id) ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const child of subModules) {
    const childSlug = child.id.slice(packageName.length + 1);
    nodes.push({
      children: moduleChildren(child, modulesById, childrenByParentId, context),
      collapsible: true,
      href: `/${collectionName}/${packageSlug}/${childSlug}`,
      label: lastSegment(child.id),
      type: 'group',
    });
  }
  return nodes;
}

function expandSidebarRows(
  symbol: ReferenceExport,
  exportsByName: Map<string, ReferenceExport>,
): SidebarRow[] {
  if (symbol.kind === 'function') {
    return [
      {
        label: `${symbol.name}()`,
        segment: symbol.name,
      },
    ];
  }
  if (symbol.kind === 'variable') {
    const expanded = expandVariableRows(
      symbol.name,
      symbol.type,
      exportsByName,
    );
    if (expanded !== undefined) {
      return expanded;
    }
  }
  return [
    {
      label: symbol.name,
      segment: symbol.name,
    },
  ];
}

function expandVariableRows(
  variableName: string,
  typeTokens: TypeToken[],
  exportsByName: Map<string, ReferenceExport>,
): SidebarRow[] | undefined {
  const typeName = findTypeRefName(typeTokens);
  if (typeName === undefined) {
    return undefined;
  }
  const typeExport = exportsByName.get(typeName);
  if (typeExport === undefined) {
    return undefined;
  }
  if (typeExport.kind !== 'type' && typeExport.kind !== 'interface') {
    return undefined;
  }
  const callSignatures = typeExport.callSignatures;
  const methodMembers = typeExport.members.filter(
    (member) => member.kind === 'method',
  );
  if (callSignatures.length === 0 && methodMembers.length === 0) {
    return undefined;
  }
  const rows: SidebarRow[] = [];
  if (callSignatures.length > 0) {
    rows.push({
      label: `${variableName}()`,
      segment: variableName,
    });
  }
  for (const method of methodMembers) {
    rows.push({
      label: `${variableName}.${method.name}()`,
      segment: `${variableName}.${method.name}`,
    });
  }
  return rows;
}

function findTypeRefName(tokens: TypeToken[]): string | undefined {
  for (const token of tokens) {
    if (token.kind === 'ref') {
      return token.name;
    }
    const match = /^([A-Z][\w$]*)(?:<.*>)?$/.exec(token.text.trim());
    if (match !== null) {
      return match[1];
    }
  }
  return undefined;
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
    label: lastSegment(child.id),
    type: 'group',
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

function lastSegment(id: string) {
  const slashIndex = id.lastIndexOf('/');
  return slashIndex === -1 ? id : id.slice(slashIndex + 1);
}
