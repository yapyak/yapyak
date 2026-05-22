import type {
  CollectionConfig,
  Config,
  TypedocPackage,
} from '../types/config.ts';
import type {
  Collection,
  Manifest,
  Page,
  SidebarNode,
  SymbolEntry,
} from '../types/manifest.ts';

import { extractMarkdoc } from '../extract/markdoc/extract.ts';
import {
  buildModulePage,
  buildSymbolIndex,
  buildSymbolPage,
} from '../extract/typedoc/build-page.ts';
import { extractTypedoc } from '../extract/typedoc/extract.ts';
import { buildMarkdocSidebar, buildTypedocPackageRoot } from './sidebar.ts';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function buildManifest(config: Config): Promise<Manifest> {
  const collections: Record<string, Collection> = {};
  const symbols: Record<string, SymbolEntry> = {};

  for (const [name, collectionConfig] of Object.entries(config.collections)) {
    const collection = await buildCollection(name, collectionConfig, symbols);
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
): Promise<Collection> {
  if (config.source === 'markdoc') {
    return buildMarkdocCollection(collectionName, config.root);
  }
  return buildTypedocCollection(collectionName, config.packages, symbols);
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
): Promise<Collection> {
  const pages: Record<string, Page> = {};
  const redirects: Record<string, string> = {};
  const sidebar: SidebarNode[] = [];

  for (const pkg of packages) {
    const packageName = await readPackageName(pkg.root);
    const packageSlug = pkg.name ?? packageName;
    validateSlug(packageSlug);

    const refManifest = await extractTypedoc({
      collectionName,
      packageDir: pkg.root,
      packageSlug,
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
      const moduleLabel = isRootModule ? packageName : subSlug;

      for (const symbol of module.exports) {
        const path = isRootModule
          ? `${packageSlug}/${symbol.name}`
          : `${packageSlug}/${subSlug}/${symbol.name}`;
        const href = `/${collectionName}/${path}`;
        const page = buildSymbolPage(symbol, {
          collectionName,
          href,
          index,
          moduleId: module.id,
          packageName,
          packageSlug,
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

    sidebar.push(
      buildTypedocPackageRoot(refManifest, {
        collapsible: pkg.collapsible ?? false,
        collectionName,
        expanded: pkg.expanded ?? false,
        label: packageName,
        packageName,
        packageSlug,
      }),
    );
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
