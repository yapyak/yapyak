import type { CollectionConfig, Config } from '../types/config.ts';
import type {
  Collection,
  Manifest,
  Page,
  SymbolEntry,
} from '../types/manifest.ts';

import { extractMarkdoc, loadMarkdocPage } from '../extract/markdoc/extract.ts';
import {
  buildSymbolIndex,
  buildSymbolPage,
} from '../extract/typedoc/build-page.ts';
import { extractTypedoc } from '../extract/typedoc/extract.ts';
import { buildMarkdocSidebar, buildTypedocSidebar } from './sidebar.ts';

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
  return buildTypedocCollection(
    collectionName,
    config.packageDir,
    config.intro,
    symbols,
  );
}

async function buildMarkdocCollection(
  collectionName: string,
  root: string,
): Promise<Collection> {
  const { pages: pagesMap } = await extractMarkdoc(root, collectionName);
  const pages: Record<string, Page> = {};
  for (const [path, page] of pagesMap) {
    pages[path] = page;
  }
  const sidebar = await buildMarkdocSidebar(root, collectionName);
  return {
    pages,
    redirects: {},
    sidebar,
  };
}

async function buildTypedocCollection(
  collectionName: string,
  packageDir: string,
  introPath: string | undefined,
  symbols: Record<string, SymbolEntry>,
): Promise<Collection> {
  const refManifest = await extractTypedoc({
    collectionName,
    packageDir,
  });
  const index = buildSymbolIndex(refManifest);
  const rootModule = findRootModule(refManifest);

  const pages: Record<string, Page> = {};
  const redirects: Record<string, string> = {};

  for (const module of refManifest.modules) {
    for (const symbol of module.exports) {
      const path = pathFor(module.id, symbol.name, rootModule);
      const href = `/${collectionName}/${path}`;
      const page = buildSymbolPage(symbol, {
        collectionName,
        href,
        index,
        moduleId: module.id,
        rootModule,
      });
      pages[path] = page;
      symbols[symbol.name] = { collection: collectionName, path };
    }

    if (module.id !== rootModule) {
      const moduleSlug = module.id.slice(rootModule.length + 1);
      const firstExport = module.exports[0];
      if (firstExport !== undefined) {
        redirects[moduleSlug] =
          `/${collectionName}/${moduleSlug}/${firstExport.name}`;
      }
    }
  }

  let introPage: Page | null = null;
  if (introPath !== undefined) {
    introPage = await loadMarkdocPage(
      introPath,
      `/${collectionName}/introduction`,
    );
    if (introPage !== null) {
      pages.introduction = introPage;
    }
  }

  const sidebar = buildTypedocSidebar(refManifest, collectionName, rootModule);
  if (introPage !== null) {
    sidebar.unshift({
      href: `/${collectionName}/introduction`,
      label: introPage.title || 'Introduction',
      type: 'link',
    });
  }

  return { pages, redirects, sidebar };
}

function findRootModule(refManifest: {
  modules: Array<{ id: string }>;
}): string {
  const ids = refManifest.modules.map((module) => module.id);
  if (ids.length === 0) {
    return '';
  }
  return ids.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest,
  );
}

function pathFor(moduleId: string, name: string, rootModule: string): string {
  if (moduleId === rootModule) {
    return name;
  }
  const slug = moduleId.slice(rootModule.length + 1);
  return `${slug}/${name}`;
}
