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
import { encodeSymbolSegment } from '../symbol-segment';
import { buildMarkdownSidebar } from './markdown-sidebar';
import { buildPackageRoot } from './package-root';
import { buildSupplement } from './supplement';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

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
  breadcrumbs: string[];
  description: string;
  href: string;
  meta: Record<string, MetaValue>;
  title: string;
};

export type LoadedPage = {
  blocks: Block[];
  page: Page;
};

export type Manifest = {
  collections: Record<string, Collection>;
  options: OptionsRegistry;
  symbols: Record<string, SymbolEntry>;
  version: 1;
};

export type Collection = {
  content: Record<string, Block[]>;
  pages: Record<string, Page>;
  redirects: Record<string, string>;
  sidebarNodes: SidebarNode[];
};

export type NavigationManifest = {
  collections: Record<string, NavigationCollection>;
  options: OptionsRegistry;
  symbols: Record<string, SymbolEntry>;
  version: 1;
};

export type NavigationCollection = {
  pages: Record<string, Page>;
  redirects: Record<string, string>;
  sidebarNodes: SidebarNode[];
};

export type SymbolEntry = {
  collection: string;
  path: string;
};

export type SidebarNode = SidebarGroupNode | SidebarLinkNode;

export type SidebarBadge = {
  text?: string;
  variant: 'deprecated' | 'kind';
};

export type SidebarGroupNode = {
  badge?: SidebarBadge;
  children: SidebarNode[];
  collapsible: boolean;
  defaultOpen?: boolean;
  href?: string;
  label: string;
  kind: 'group';
};

export type SidebarLinkNode = {
  badge?: SidebarBadge;
  href: string;
  label: string;
  kind: 'link';
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
    assignBreadcrumbs(collection);
    collections[name] = collection;
  }

  return {
    collections,
    options: config.options ?? {},
    symbols,
    version: 1,
  };
}

function assignBreadcrumbs(collection: Collection): void {
  const breadcrumbsByHref = buildBreadcrumbs(collection.sidebarNodes);
  for (const page of Object.values(collection.pages)) {
    page.breadcrumbs = breadcrumbsByHref.get(page.href) ?? [];
  }
}

function buildBreadcrumbs(sidebarNodes: SidebarNode[]): Map<string, string[]> {
  const breadcrumbsByHref = new Map<string, string[]>();
  const walk = (sidebarNodes: SidebarNode[], trail: string[]): void => {
    for (const sidebarNode of sidebarNodes) {
      if (sidebarNode.kind === 'link') {
        breadcrumbsByHref.set(sidebarNode.href, trail);
        continue;
      }
      if (sidebarNode.href !== undefined) {
        breadcrumbsByHref.set(sidebarNode.href, trail);
      }
      walk(sidebarNode.children, [
        ...trail,
        sidebarNode.label,
      ]);
    }
  };
  walk(sidebarNodes, []);
  return breadcrumbsByHref;
}

async function buildCollection(
  collectionName: string,
  config: CollectionConfig,
  symbols: Record<string, SymbolEntry>,
  sourceUrl: SourceUrlConfig | undefined,
): Promise<Collection> {
  if (config.kind === 'markdown') {
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
  const content: Record<string, Block[]> = {};
  const pages: Record<string, Page> = {};
  for (const [path, loadedPage] of pagesMap) {
    content[path] = loadedPage.blocks;
    pages[path] = loadedPage.page;
  }
  const redirects: Record<string, string> = {};
  for (const [path, target] of redirectsMap) {
    redirects[path] = target;
  }
  const sidebarNodes = await buildMarkdownSidebar(root, collectionName);
  return {
    content,
    pages,
    redirects,
    sidebarNodes,
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

function buildDirectorySourceHref(
  absolutePath: string,
  sourceUrl: SourceUrlConfig | undefined,
): string | undefined {
  if (sourceUrl === undefined) {
    return undefined;
  }
  const path = relative(sourceUrl.workspaceRoot, absolutePath).replaceAll(
    '\\',
    '/',
  );
  return sourceUrl.template
    .replaceAll('{path}', path)
    .replace(/#L?\{line\}/, '')
    .replaceAll('{line}', '');
}

async function buildTypeScriptCollection(
  collectionName: string,
  packages: TypeScriptPackage[],
  supplements: Supplement[] | undefined,
  symbols: Record<string, SymbolEntry>,
  sourceUrl: SourceUrlConfig | undefined,
): Promise<Collection> {
  const content: Record<string, Block[]> = {};
  const pages: Record<string, Page> = {};
  const redirects: Record<string, string> = {};
  const sidebarNodesByGroup = new Map<string, SidebarNode[]>();
  const groupOrder: string[] = [];
  const ungroupedSidebarNodes: SidebarNode[] = [];

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
          const loadedPage = buildSymbolPage(
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
          pages[path] = loadedPage.page;
          content[path] = loadedPage.blocks;
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
          const memberLoadedPage =
            member.kind === 'method'
              ? buildMethodPage(symbol, member, context, subInput, subOptions)
              : buildPropertyMemberPage(
                  symbol,
                  member,
                  context,
                  subInput,
                  subOptions,
                );
          pages[memberPath] = memberLoadedPage.page;
          content[memberPath] = memberLoadedPage.blocks;
          symbols[`${packageSlug}/${symbol.name}.${member.name}`] = {
            collection: collectionName,
            path: memberPath,
          };
        }
      }

      const moduleLoadedPage = buildModulePage(module, context, {
        href: moduleHref,
        index,
        label: moduleLabel,
        moduleId: module.id,
        sourceHref: buildDirectorySourceHref(
          join(typescriptPackage.root, module.sourcePath),
          sourceUrl,
        ),
      });
      pages[modulePath] = moduleLoadedPage.page;
      content[modulePath] = moduleLoadedPage.blocks;
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
      const packageLoadedPage = buildPackageIndexPage(context, {
        href: `/${collectionName}/${packageSlug}`,
        label: displayName,
        sourceHref: buildDirectorySourceHref(typescriptPackage.root, sourceUrl),
        subpaths,
      });
      pages[packageSlug] = packageLoadedPage.page;
      content[packageSlug] = packageLoadedPage.blocks;
    }

    const packageSidebarNode = buildPackageRoot(referenceManifest, context, {
      collapsible: typescriptPackage.collapsible ?? false,
      expanded: typescriptPackage.expanded ?? false,
      label: displayName,
    });

    if (typescriptPackage.group === undefined) {
      ungroupedSidebarNodes.push(packageSidebarNode);
      continue;
    }
    let groupBucket = sidebarNodesByGroup.get(typescriptPackage.group);
    if (groupBucket === undefined) {
      groupBucket = [];
      sidebarNodesByGroup.set(typescriptPackage.group, groupBucket);
      groupOrder.push(typescriptPackage.group);
    }
    groupBucket.push(packageSidebarNode);
  }

  const supplementSidebarNodes: SidebarNode[] = [];
  for (const supplement of supplements ?? []) {
    const result = await buildSupplement({
      collectionName,
      supplement,
    });
    for (const [pagePath, page] of result.pages) {
      pages[pagePath] = page;
    }
    for (const [pagePath, blocks] of result.content) {
      content[pagePath] = blocks;
    }
    for (const [pagePath, target] of result.redirects) {
      redirects[pagePath] = target;
    }
    for (const [symbolKey, entry] of Object.entries(result.symbols)) {
      symbols[symbolKey] = entry;
    }
    supplementSidebarNodes.push(result.sidebarNode);
  }

  const sidebarNodes: SidebarNode[] = [
    ...ungroupedSidebarNodes,
  ];
  for (const groupLabel of groupOrder) {
    const children = sidebarNodesByGroup.get(groupLabel) ?? [];
    sidebarNodes.push({
      children,
      collapsible: false,
      kind: 'group',
      label: groupLabel,
    });
  }
  sidebarNodes.push(...supplementSidebarNodes);

  return {
    content,
    pages,
    redirects,
    sidebarNodes,
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
      `[docs-compiler] Invalid package name "${slug}". Use letters, digits, "@", "/", "_", or "-".`,
    );
  }
}
