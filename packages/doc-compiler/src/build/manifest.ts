import type { Block } from '../access';
import type {
  CollectionConfig,
  Config,
  OptionsRegistry,
  SourceUrlConfig,
  Supplement,
  TypeScriptPackage,
} from '../config';
import type {
  PackageContext,
  ReferenceExport,
  ReferenceManifest,
  ReferenceModule,
  SymbolIndexEntry,
} from '../extract/typescript';

import { extractMarkdown } from '../extract/markdown';
import {
  buildMethodPage,
  buildModulePage,
  buildPackageIndexPage,
  buildPropertyMemberPage,
  buildSymbolIndex,
  buildSymbolPage,
  extractPackage,
  getTypeCallSignatures,
  getTypeMembers,
  resolveTypeExport,
} from '../extract/typescript';
import { slugify } from '../slugify';
import { encodeSymbolSegment } from '../symbol-path';
import { buildMarkdownSidebar } from './markdown-sidebar';
import { buildPackageRoot } from './package-root';
import { buildSupplement } from './supplement';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type MetaValue =
  | string
  | number
  | boolean
  | null
  | MetaValue[]
  | {
      [key: string]: MetaValue;
    };

export type Page = {
  blocks: Block[];
  description: string;
  href: string;
  meta: Record<string, MetaValue>;
  title: string;
};

export type Manifest = {
  collections: Record<string, Collection>;
  options: OptionsRegistry;
  symbols: Record<string, SymbolEntry>;
  version: 1;
};

export type Collection = {
  pages: Record<string, Page>;
  redirects: Record<string, string>;
  sidebar: SidebarNode[];
};

export type SymbolEntry = {
  collection: string;
  path: string;
};

export type SidebarNode = SidebarGroup | SidebarLink;

export type SidebarBadge = {
  text?: string;
  variant: 'deprecated' | 'kind';
};

export type SidebarGroup = {
  badge?: SidebarBadge;
  children: SidebarNode[];
  collapsible: boolean;
  defaultOpen?: boolean;
  href?: string;
  label: string;
  type: 'group';
};

export type SidebarLink = {
  badge?: SidebarBadge;
  href: string;
  label: string;
  type: 'link';
};

export async function buildManifest(config: Config): Promise<Manifest> {
  const collections: Record<string, Collection> = {};
  const symbols: Record<string, SymbolEntry> = {};

  for (const [name, collectionConfig] of Object.entries(config.collections)) {
    const collection = await buildCollection(
      name,
      collectionConfig,
      symbols,
      config.sourceUrl,
    );
    collections[name] = collection;
  }

  return {
    collections,
    options: config.options ?? {},
    symbols,
    version: 1,
  };
}

async function buildCollection(
  collectionName: string,
  config: CollectionConfig,
  symbols: Record<string, SymbolEntry>,
  sourceUrl: SourceUrlConfig | undefined,
): Promise<Collection> {
  if (config.source === 'markdown') {
    return buildMarkdownCollection(collectionName, config.root);
  }
  return buildTypeScriptCollection(
    collectionName,
    config.packages,
    config.supplements,
    symbols,
    sourceUrl,
  );
}

async function buildMarkdownCollection(
  collectionName: string,
  root: string,
): Promise<Collection> {
  const { pages: pagesMap, redirects: redirectsMap } = await extractMarkdown(
    root,
    collectionName,
  );
  const pages: Record<string, Page> = {};
  for (const [path, page] of pagesMap) {
    pages[path] = page;
  }
  const redirects: Record<string, string> = {};
  for (const [path, target] of redirectsMap) {
    redirects[path] = target;
  }
  const sidebar = await buildMarkdownSidebar(root, collectionName);
  return {
    pages,
    redirects,
    sidebar,
  };
}

type PackageRenderContext = {
  context: PackageContext;
  displayName: string;
  modules: ModuleRenderContext[];
  packageName: string;
  packageSlug: string;
  referenceManifest: ReferenceManifest;
  typescriptPackage: TypeScriptPackage;
};

type ModuleRenderContext = {
  module: ReferenceModule;
  moduleHref: string;
  moduleLabel: string;
  modulePath: string;
  root: boolean;
  subSlug: string;
  variableByTypeName: Map<string, string>;
};

async function buildTypeScriptCollection(
  collectionName: string,
  packages: TypeScriptPackage[],
  supplements: Supplement[] | undefined,
  symbols: Record<string, SymbolEntry>,
  sourceUrl: SourceUrlConfig | undefined,
): Promise<Collection> {
  const pages: Record<string, Page> = {};
  const redirects: Record<string, string> = {};
  const nodesByGroup = new Map<string, SidebarNode[]>();
  const groupOrder: string[] = [];
  const ungroupedNodes: SidebarNode[] = [];

  const renderContexts: PackageRenderContext[] = [];
  const entries: SymbolIndexEntry[] = [];

  for (const typescriptPackage of packages) {
    const packageName = await readPackageName(typescriptPackage.root);
    const packageSlug = slugify(typescriptPackage.name);
    validateSlug(packageSlug);
    const displayName = typescriptPackage.name;
    const context: PackageContext = {
      collectionName,
      packageName,
      packageSlug,
    };

    const referenceManifest = extractPackage({
      context,
      packageDir: typescriptPackage.root,
      subpaths: typescriptPackage.subpaths,
    });

    const moduleContexts: ModuleRenderContext[] = [];

    for (const module of referenceManifest.modules) {
      const isRootModule = module.id === packageName;
      const subSlug = isRootModule
        ? ''
        : module.id.slice(packageName.length + 1);
      const modulePath = isRootModule
        ? packageSlug
        : `${packageSlug}/${subSlug}`;
      const moduleHref = `/${collectionName}/${modulePath}`;
      const moduleLabel = isRootModule ? displayName : subSlug;

      const exportsByName = new Map<string, ReferenceExport>();
      for (const symbol of module.exports) {
        exportsByName.set(symbol.name, symbol);
      }

      const variableByTypeName = new Map<string, string>();
      for (const symbol of module.exports) {
        if (symbol.kind !== 'variable') {
          continue;
        }
        const typeExport = resolveTypeExport(symbol.type, exportsByName);
        if (typeExport === undefined) {
          continue;
        }
        if (!variableByTypeName.has(typeExport.name)) {
          variableByTypeName.set(typeExport.name, symbol.name);
        }
      }

      for (const symbol of module.exports) {
        const safeName = encodeSymbolSegment(symbol.name);
        const path = isRootModule
          ? `${packageSlug}/${safeName}`
          : `${packageSlug}/${subSlug}/${safeName}`;
        const href = `/${collectionName}/${path}`;
        const variableTypeExport =
          symbol.kind === 'variable'
            ? resolveTypeExport(symbol.type, exportsByName)
            : undefined;
        const resolvedCallSignatures =
          getTypeCallSignatures(variableTypeExport);
        const resolvedMembers = getTypeMembers(variableTypeExport);
        const variableHasCallSignature = resolvedCallSignatures.length > 0;
        const variableHasMethods = resolvedMembers.some(
          (member) => member.kind === 'method',
        );
        const isPureNamespaceVariable =
          symbol.kind === 'variable' &&
          !variableHasCallSignature &&
          variableHasMethods;

        let symbolHref = href;
        if (isPureNamespaceVariable && variableTypeExport !== undefined) {
          const typeSegment = encodeSymbolSegment(variableTypeExport.name);
          const typePath = isRootModule
            ? `${packageSlug}/${typeSegment}`
            : `${packageSlug}/${subSlug}/${typeSegment}`;
          symbolHref = `/${collectionName}/${typePath}`;
        }

        const hrefsByMemberName = new Map<string, string>();
        const callableMemberNames = new Set<string>();
        if (symbol.kind === 'variable') {
          const documentedMembers = [
            ...symbol.members,
            ...resolvedMembers,
          ].filter((member) => member.description.length > 0);
          for (const member of documentedMembers) {
            const subSegment = encodeSymbolSegment(
              `${symbol.name}.${member.name}`,
            );
            const subPath = isRootModule
              ? `${packageSlug}/${subSegment}`
              : `${packageSlug}/${subSlug}/${subSegment}`;
            hrefsByMemberName.set(member.name, `/${collectionName}/${subPath}`);
            if (member.kind === 'method') {
              callableMemberNames.add(member.name);
            }
          }
        }
        const isCallable =
          symbol.kind === 'function' ||
          symbol.kind === 'class' ||
          (symbol.kind === 'variable' && variableHasCallSignature);

        entries.push({
          callable: isCallable,
          callableMemberNames,
          href: symbolHref,
          hrefsByMemberName,
          moduleId: module.id,
          name: symbol.name,
          packageSlug,
        });
      }

      moduleContexts.push({
        module,
        moduleHref,
        moduleLabel,
        modulePath,
        root: isRootModule,
        subSlug,
        variableByTypeName,
      });
    }

    renderContexts.push({
      context,
      displayName,
      modules: moduleContexts,
      packageName,
      packageSlug,
      referenceManifest,
      typescriptPackage,
    });
  }

  const index = buildSymbolIndex(entries);

  for (const renderContext of renderContexts) {
    const {
      context,
      displayName,
      modules: moduleContexts,
      packageName,
      packageSlug,
      referenceManifest,
      typescriptPackage,
    } = renderContext;

    for (const moduleContext of moduleContexts) {
      const {
        module,
        moduleHref,
        moduleLabel,
        modulePath,
        root: isRootModule,
        subSlug,
        variableByTypeName,
      } = moduleContext;

      const exportsByName = new Map<string, ReferenceExport>();
      for (const symbol of module.exports) {
        exportsByName.set(symbol.name, symbol);
      }

      for (const symbol of module.exports) {
        const safeName = encodeSymbolSegment(symbol.name);
        const path = isRootModule
          ? `${packageSlug}/${safeName}`
          : `${packageSlug}/${subSlug}/${safeName}`;
        const href = `/${collectionName}/${path}`;
        const variableTypeExport =
          symbol.kind === 'variable'
            ? resolveTypeExport(symbol.type, exportsByName)
            : undefined;
        const resolvedCallSignatures =
          getTypeCallSignatures(variableTypeExport);
        const resolvedMembers = getTypeMembers(variableTypeExport);
        const variableHasCallSignature = resolvedCallSignatures.length > 0;
        const variableHasMethods = resolvedMembers.some(
          (member) => member.kind === 'method',
        );
        const isPureNamespaceVariable =
          symbol.kind === 'variable' &&
          !variableHasCallSignature &&
          variableHasMethods;

        const variableDocumentedMethods =
          symbol.kind === 'variable'
            ? resolvedMembers.filter(
                (
                  member,
                ): member is typeof member & {
                  kind: 'method';
                } => member.kind === 'method' && member.description.length > 0,
              )
            : [];

        if (isPureNamespaceVariable && variableTypeExport !== undefined) {
          const typeSegment = encodeSymbolSegment(variableTypeExport.name);
          const typePath = isRootModule
            ? `${packageSlug}/${typeSegment}`
            : `${packageSlug}/${subSlug}/${typeSegment}`;
          symbols[`${packageSlug}/${symbol.name}`] = {
            collection: collectionName,
            path: typePath,
          };
        } else {
          const page = buildSymbolPage(
            symbol,
            context,
            {
              href,
              index,
              moduleId: module.id,
              packageDir: typescriptPackage.root,
            },
            {
              ...(variableHasCallSignature && {
                eyebrowKind: 'function' as const,
              }),
              ...((symbol.kind === 'type' || symbol.kind === 'interface') &&
                variableByTypeName.get(symbol.name) !== undefined && {
                  methodLinkVariable: variableByTypeName.get(symbol.name),
                }),
              ...(symbol.kind === 'variable' &&
                variableDocumentedMethods.length > 0 && {
                  methodLinkVariable: symbol.name,
                  variableMethods: variableDocumentedMethods,
                }),
              sourceUrl,
            },
          );
          pages[path] = page;
          symbols[`${packageSlug}/${symbol.name}`] = {
            collection: collectionName,
            path,
          };
        }

        if (symbol.kind !== 'variable') {
          continue;
        }
        const documentedMembers = [
          ...symbol.members,
          ...resolvedMembers,
        ].filter((member) => member.description.length > 0);
        const parentEntry = symbols[`${packageSlug}/${symbol.name}`];
        if (parentEntry === undefined) {
          continue;
        }
        const parentLink = {
          href: `/${parentEntry.collection}/${parentEntry.path}`,
          label:
            isPureNamespaceVariable && variableTypeExport !== undefined
              ? variableTypeExport.name
              : symbol.name,
        };
        const memberPathsByName = new Map<string, string>();
        for (const member of documentedMembers) {
          const segment = encodeSymbolSegment(`${symbol.name}.${member.name}`);
          memberPathsByName.set(
            member.name,
            isRootModule
              ? `${packageSlug}/${segment}`
              : `${packageSlug}/${subSlug}/${segment}`,
          );
        }
        for (const member of documentedMembers) {
          const memberPath = memberPathsByName.get(member.name);
          if (memberPath === undefined) {
            continue;
          }
          const siblings = documentedMembers
            .filter((other) => other.name !== member.name)
            .map((other) => ({
              href: `/${collectionName}/${memberPathsByName.get(other.name)}`,
              label:
                other.kind === 'method'
                  ? `${symbol.name}.${other.name}()`
                  : `${symbol.name}.${other.name}`,
            }));
          const subInput = {
            href: `/${collectionName}/${memberPath}`,
            index,
            moduleId: module.id,
            packageDir: typescriptPackage.root,
            parent: parentLink,
            siblings,
          };
          const subOptions = {
            sourceUrl,
          };
          pages[memberPath] =
            member.kind === 'method'
              ? buildMethodPage(symbol, member, context, subInput, subOptions)
              : buildPropertyMemberPage(
                  symbol,
                  member,
                  context,
                  subInput,
                  subOptions,
                );
          symbols[`${packageSlug}/${symbol.name}.${member.name}`] = {
            collection: collectionName,
            path: memberPath,
          };
        }
      }

      pages[modulePath] = buildModulePage(module, context, {
        href: moduleHref,
        index,
        label: moduleLabel,
        moduleId: module.id,
      });
    }

    const hasRootModule = referenceManifest.modules.some(
      (module) => module.id === packageName,
    );
    if (!hasRootModule) {
      const prefix = `${packageName}/`;
      const topLevelSubModules = referenceManifest.modules
        .filter(
          (module) =>
            module.id.startsWith(prefix) &&
            !module.id.slice(prefix.length).includes('/'),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
      const subpaths = topLevelSubModules.map((module) => {
        const tail = module.id.slice(prefix.length);
        return {
          description: module.description,
          href: `/${collectionName}/${packageSlug}/${tail}`,
          subpath: `./${tail}`,
        };
      });
      pages[packageSlug] = buildPackageIndexPage(context, {
        href: `/${collectionName}/${packageSlug}`,
        label: displayName,
        subpaths,
      });
    }

    const packageNode = buildPackageRoot(referenceManifest, context, {
      collapsible: typescriptPackage.collapsible ?? false,
      expanded: typescriptPackage.expanded ?? false,
      label: displayName,
    });

    if (typescriptPackage.group === undefined) {
      ungroupedNodes.push(packageNode);
      continue;
    }
    let groupBucket = nodesByGroup.get(typescriptPackage.group);
    if (groupBucket === undefined) {
      groupBucket = [];
      nodesByGroup.set(typescriptPackage.group, groupBucket);
      groupOrder.push(typescriptPackage.group);
    }
    groupBucket.push(packageNode);
  }

  const supplementNodes: SidebarNode[] = [];
  for (const supplement of supplements ?? []) {
    const result = await buildSupplement({
      collectionName,
      supplement,
    });
    for (const [pagePath, page] of result.pages) {
      pages[pagePath] = page;
    }
    for (const [pagePath, target] of result.redirects) {
      redirects[pagePath] = target;
    }
    for (const [symbolKey, entry] of Object.entries(result.symbols)) {
      symbols[symbolKey] = entry;
    }
    supplementNodes.push(result.group);
  }

  const sidebar: SidebarNode[] = [
    ...ungroupedNodes,
  ];
  for (const groupLabel of groupOrder) {
    const children = nodesByGroup.get(groupLabel) ?? [];
    sidebar.push({
      children,
      collapsible: false,
      label: groupLabel,
      type: 'group',
    });
  }
  sidebar.push(...supplementNodes);

  return {
    pages,
    redirects,
    sidebar,
  };
}

async function readPackageName(packageDir: string): Promise<string> {
  const raw = await readFile(join(packageDir, 'package.json'), 'utf8');
  const parsed = JSON.parse(raw) as {
    name: string;
  };
  return parsed.name;
}

function validateSlug(slug: string): void {
  if (!/^[A-Za-z0-9@/_-]+$/.test(slug)) {
    throw new Error(
      `[doc-compiler] Invalid package name "${slug}". Use letters, digits, "@", "/", "_", or "-".`,
    );
  }
}
