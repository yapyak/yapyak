import type { Block } from '../access';
import type {
  CollectionConfig,
  Config,
  OptionsRegistry,
  SourceUrlConfig,
  Supplement,
  TypeScriptPackage,
} from '../config';
import type { ReferenceExport, TypeToken } from '../extract/typescript';

import { extractMarkdown } from '../extract/markdown';
import {
  buildMethodPage,
  buildModulePage,
  buildPackageIndexPage,
  buildSymbolIndex,
  buildSymbolPage,
  extractPackage,
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

  for (const typescriptPackage of packages) {
    const packageName = await readPackageName(typescriptPackage.root);
    const packageSlug = slugify(typescriptPackage.name);
    validateSlug(packageSlug);
    const displayName = typescriptPackage.name;
    const context = {
      collectionName,
      packageName,
      packageSlug,
    };

    const refManifest = extractPackage({
      context,
      packageDir: typescriptPackage.root,
      subpaths: typescriptPackage.subpaths,
    });
    const index = buildSymbolIndex(refManifest);

    for (const module of refManifest.modules) {
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
        const variableHasCallSignature =
          variableTypeExport !== undefined &&
          (variableTypeExport.kind === 'type' ||
            variableTypeExport.kind === 'interface') &&
          variableTypeExport.callSignatures.length > 0;
        const variableHasMethods =
          variableTypeExport !== undefined &&
          (variableTypeExport.kind === 'type' ||
            variableTypeExport.kind === 'interface') &&
          variableTypeExport.members.some((m) => m.kind === 'method');
        const isPureNamespaceVariable =
          symbol.kind === 'variable' &&
          !variableHasCallSignature &&
          variableHasMethods;

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
              sourceUrl,
            },
          );
          pages[path] = page;
          symbols[`${packageSlug}/${symbol.name}`] = {
            collection: collectionName,
            path,
          };
        }

        if (
          variableTypeExport === undefined ||
          (variableTypeExport.kind !== 'type' &&
            variableTypeExport.kind !== 'interface')
        ) {
          continue;
        }
        for (const member of variableTypeExport.members) {
          if (member.kind !== 'method') {
            continue;
          }
          const subSegment = encodeSymbolSegment(
            `${symbol.name}.${member.name}`,
          );
          const subPath = isRootModule
            ? `${packageSlug}/${subSegment}`
            : `${packageSlug}/${subSlug}/${subSegment}`;
          const subHref = `/${collectionName}/${subPath}`;
          const subPage = buildMethodPage(
            symbol,
            member,
            context,
            {
              href: subHref,
              index,
              moduleId: module.id,
              packageDir: typescriptPackage.root,
            },
            {
              sourceUrl,
            },
          );
          pages[subPath] = subPage;
          symbols[`${packageSlug}/${symbol.name}.${member.name}`] = {
            collection: collectionName,
            path: subPath,
          };
        }
      }

      pages[modulePath] = buildModulePage(module, context, {
        href: moduleHref,
        index,
        label: moduleLabel,
      });
    }

    const hasRootModule = refManifest.modules.some(
      (module) => module.id === packageName,
    );
    if (!hasRootModule) {
      const prefix = `${packageName}/`;
      const topLevelSubModules = refManifest.modules
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

    const packageNode = buildPackageRoot(refManifest, context, {
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

function resolveTypeExport(
  typeTokens: TypeToken[],
  exportsByName: Map<string, ReferenceExport>,
): ReferenceExport | undefined {
  const typeName = findTypeIdentifier(typeTokens);
  if (typeName === undefined) {
    return undefined;
  }
  const typeExport = exportsByName.get(typeName);
  if (
    typeExport !== undefined &&
    (typeExport.kind === 'type' || typeExport.kind === 'interface')
  ) {
    return typeExport;
  }
  return undefined;
}

function findTypeIdentifier(tokens: TypeToken[]): string | undefined {
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
