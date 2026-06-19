import type { Block } from '../access';
import type {
  CollectionConfig,
  Config,
  OptionsRegistry,
  SourceUrlConfig,
  TypeScriptPackage,
} from '../config';

import { extractMarkdoc } from '../extract/markdoc';
import {
  buildModulePage,
  buildPackageIndexPage,
  buildSymbolIndex,
  buildSymbolPage,
  extractPackage,
} from '../extract/typescript';
import { slugify } from '../slugify';
import { encodeSymbolSegment } from '../symbol-path';
import { buildMarkdocSidebar } from './markdoc-sidebar';
import { buildPackageRoot } from './package-root';
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
    symbols,
    sourceUrl,
  );
}

async function buildMarkdownCollection(
  collectionName: string,
  root: string,
): Promise<Collection> {
  const { pages: pagesMap, redirects: redirectsMap } = await extractMarkdoc(
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
  const sidebar = await buildMarkdocSidebar(root, collectionName);
  return {
    pages,
    redirects,
    sidebar,
  };
}

async function buildTypeScriptCollection(
  collectionName: string,
  packages: TypeScriptPackage[],
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

      for (const symbol of module.exports) {
        const safeName = encodeSymbolSegment(symbol.name);
        const path = isRootModule
          ? `${packageSlug}/${safeName}`
          : `${packageSlug}/${subSlug}/${safeName}`;
        const href = `/${collectionName}/${path}`;
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
            sourceUrl,
          },
        );
        pages[path] = page;
        symbols[`${packageSlug}/${symbol.name}`] = {
          collection: collectionName,
          path,
        };
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
      `[doc-extractor] Invalid package name "${slug}". Use letters, digits, "@", "/", "_", or "-".`,
    );
  }
}
