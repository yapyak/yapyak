import type { Block } from '../access/block.ts';
import type {
  CollectionConfig,
  Config,
  SourceUrlConfig,
  TypedocPackage,
} from '../config.ts';

import { extractMarkdoc } from '../extract/markdoc/extract.ts';
import { extractTypedoc } from '../extract/typedoc/index.ts';
import {
  buildModulePage,
  buildSymbolPage,
  buildTypedocPackageIndexPage,
} from '../extract/typedoc/page.ts';
import { buildSymbolIndex } from '../extract/typedoc/symbol-index.ts';
import { slugify } from '../slug.ts';
import { encodeSymbolSegment } from '../symbol-path.ts';
import { buildMarkdocSidebar } from './markdoc-sidebar.ts';
import { buildTypedocPackageRoot } from './typedoc-package-root.ts';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type MetaValue =
  | string
  | number
  | boolean
  | null
  | MetaValue[]
  | { [key: string]: MetaValue };

export interface Page {
  blocks: Block[];
  description: string;
  href: string;
  meta: Record<string, MetaValue>;
  title: string;
}

export interface Manifest {
  collections: Record<string, Collection>;
  symbols: Record<string, SymbolEntry>;
  version: 1;
}

export interface Collection {
  pages: Record<string, Page>;
  redirects: Record<string, string>;
  sidebar: SidebarNode[];
}

export interface SymbolEntry {
  collection: string;
  path: string;
}

export type SidebarNode = SidebarGroup | SidebarLink;

export interface SidebarBadge {
  text?: string;
  variant: 'deprecated' | 'kind';
}

export interface SidebarGroup {
  badge?: SidebarBadge;
  children: SidebarNode[];
  collapsible: boolean;
  defaultOpen?: boolean;
  href?: string;
  label: string;
  type: 'group';
}

export interface SidebarLink {
  badge?: SidebarBadge;
  href: string;
  label: string;
  type: 'link';
}

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
  if (config.source === 'markdoc') {
    return buildMarkdocCollection(collectionName, config.root);
  }
  return buildTypedocCollection(
    collectionName,
    config.packages,
    symbols,
    sourceUrl,
  );
}

async function buildMarkdocCollection(
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

async function buildTypedocCollection(
  collectionName: string,
  packages: TypedocPackage[],
  symbols: Record<string, SymbolEntry>,
  sourceUrl: SourceUrlConfig | undefined,
): Promise<Collection> {
  const pages: Record<string, Page> = {};
  const redirects: Record<string, string> = {};
  const groupedNodes = new Map<string, SidebarNode[]>();
  const groupOrder: string[] = [];
  const ungroupedNodes: SidebarNode[] = [];

  for (const pkg of packages) {
    const packageName = await readPackageName(pkg.root);
    const packageSlug = slugify(pkg.name);
    validateSlug(packageSlug);
    const displayName = pkg.name;

    const refManifest = await extractTypedoc({
      collectionName,
      packageDir: pkg.root,
      packageSlug,
      subpaths: pkg.subpaths,
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
        const page = buildSymbolPage(symbol, {
          collectionName,
          href,
          index,
          moduleId: module.id,
          packageDir: pkg.root,
          packageName,
          packageSlug,
          sourceUrl,
        });
        pages[path] = page;
        symbols[`${packageSlug}/${symbol.name}`] = {
          collection: collectionName,
          path,
        };
      }

      pages[modulePath] = buildModulePage(module, {
        collectionName,
        href: moduleHref,
        index,
        label: moduleLabel,
        packageName,
        packageSlug,
      });
    }

    const hasRootModule = refManifest.modules.some(
      (m) => m.id === packageName,
    );
    if (!hasRootModule) {
      const prefix = `${packageName}/`;
      const topLevelSubModules = refManifest.modules
        .filter(
          (m) =>
            m.id.startsWith(prefix) && !m.id.slice(prefix.length).includes('/'),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
      const subpaths = topLevelSubModules.map((m) => {
        const tail = m.id.slice(prefix.length);
        return {
          description: m.description,
          href: `/${collectionName}/${packageSlug}/${tail}`,
          subpath: `./${tail}`,
        };
      });
      pages[packageSlug] = buildTypedocPackageIndexPage({
        collectionName,
        href: `/${collectionName}/${packageSlug}`,
        label: displayName,
        packageName,
        packageSlug,
        subpaths,
      });
    }

    const packageNode = buildTypedocPackageRoot(refManifest, {
      collapsible: pkg.collapsible ?? false,
      collectionName,
      expanded: pkg.expanded ?? false,
      label: displayName,
      packageName,
      packageSlug,
    });

    if (!pkg.group) {
      ungroupedNodes.push(packageNode);
      continue;
    }
    let groupBucket = groupedNodes.get(pkg.group);
    if (!groupBucket) {
      groupBucket = [];
      groupedNodes.set(pkg.group, groupBucket);
      groupOrder.push(pkg.group);
    }
    groupBucket.push(packageNode);
  }

  const sidebar: SidebarNode[] = [...ungroupedNodes];
  for (const groupLabel of groupOrder) {
    const children = groupedNodes.get(groupLabel) ?? [];
    sidebar.push({
      children,
      collapsible: false,
      label: groupLabel,
      type: 'group',
    });
  }

  return { pages, redirects, sidebar };
}

async function readPackageName(packageDir: string): Promise<string> {
  const raw = await readFile(join(packageDir, 'package.json'), 'utf8');
  const parsed = JSON.parse(raw) as { name: string };
  return parsed.name;
}

function validateSlug(slug: string): void {
  if (!/^[A-Za-z0-9@/_-]+$/.test(slug)) {
    throw new Error(
      `[doc-extractor] Invalid package name "${slug}". Use letters, digits, "@", "/", "_", or "-".`,
    );
  }
}
