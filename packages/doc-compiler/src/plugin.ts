import type { Plugin, ViteDevServer } from 'vite';
import type { Block } from './access';
import type {
  Manifest,
  NavigationCollection,
  NavigationManifest,
} from './build';
import type { Config } from './config';

import { buildAgentArtifact, buildManifest, buildSearchData } from './build';
import { resolve, sep } from 'node:path';

const VIRTUAL_ID = 'virtual:doc-compiler';
const MANIFEST_ID = 'virtual:doc-compiler/manifest';
const CONTENT_ID_PREFIX = 'virtual:doc-compiler/content/';
const RESOLVED_ID = '\0virtual:doc-compiler';
const RESOLVED_MANIFEST_ID = '\0virtual:doc-compiler/manifest';
const RESOLVED_CONTENT_PREFIX = '\0virtual:doc-compiler/content/';
const REBUILD_DEBOUNCE_MS = 200;

export function docCompiler(config: Config): Plugin {
  let navigationManifest: NavigationManifest | undefined;
  let contentEntries: ContentEntry[] = [];
  let isBuild = false;
  let cachedManifest: Manifest | undefined;

  const getManifest = async (): Promise<Manifest> => {
    if (cachedManifest !== undefined) {
      return cachedManifest;
    }
    cachedManifest = await buildManifest(config);
    return cachedManifest;
  };

  const invalidateManifest = (): void => {
    cachedManifest = undefined;
  };

  const buildArtifacts = async () => {
    const artifacts = splitManifest(await getManifest());
    navigationManifest = artifacts.navigationManifest;
    contentEntries = artifacts.contentEntries;
  };

  return {
    async buildStart() {
      await buildArtifacts();
      if (!isBuild) {
        return;
      }
      const manifest = await getManifest();
      if (config.agentArtifact !== undefined) {
        const artifact = buildAgentArtifact(manifest, config.agentArtifact);
        for (const [relativePath, content] of artifact.files) {
          this.emitFile({
            fileName: relativePath,
            source: content,
            type: 'asset',
          });
        }
      }
      if (config.searchData !== undefined) {
        this.emitFile({
          fileName: config.searchData.fileName,
          source: JSON.stringify(buildSearchData(manifest)),
          type: 'asset',
        });
      }
    },
    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === 'build';
    },

    configureServer(server: ViteDevServer) {
      if (config.agentArtifact !== undefined) {
        const agentArtifact = config.agentArtifact;
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '';
          const path = url.split('?')[0] ?? '';
          if (
            !path.endsWith('.md') &&
            path !== '/llms.txt' &&
            path !== '/llms-full.txt'
          ) {
            next();
            return;
          }
          void (async () => {
            try {
              const manifest = await getManifest();
              const artifact = buildAgentArtifact(manifest, agentArtifact);
              const fileKey = path.replace(/^\//, '');
              const content = artifact.files.get(fileKey);
              if (content === undefined) {
                next();
                return;
              }
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
              res.end(content);
            } catch (error) {
              server.config.logger.error(
                `[doc-compiler] agent artifact request failed: ${String(error)}`,
              );
              next();
            }
          })();
        });
      }

      if (config.searchData !== undefined) {
        const searchPath = `/${config.searchData.fileName}`;
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '';
          const path = url.split('?')[0] ?? '';
          if (path !== searchPath) {
            next();
            return;
          }
          void (async () => {
            try {
              const manifest = await getManifest();
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(buildSearchData(manifest)));
            } catch (error) {
              server.config.logger.error(
                `[doc-compiler] search request failed: ${String(error)}`,
              );
              next();
            }
          })();
        });
      }

      const rebuild = debounce(async () => {
        try {
          invalidateManifest();
          await buildArtifacts();
          invalidateVirtualModules(server);
        } catch (error) {
          server.config.logger.error(
            `[doc-compiler] rebuild failed: ${String(error)}`,
          );
        }
      }, REBUILD_DEBOUNCE_MS);

      const watchedDirectories = getWatchedDirectories(config);
      for (const directory of watchedDirectories) {
        server.watcher.add(directory);
      }
      server.watcher.on('change', (file) => {
        if (isRelevantFile(file, watchedDirectories)) {
          rebuild();
        }
      });
      server.watcher.on('add', (file) => {
        if (isRelevantFile(file, watchedDirectories)) {
          rebuild();
        }
      });
      server.watcher.on('unlink', (file) => {
        if (isRelevantFile(file, watchedDirectories)) {
          rebuild();
        }
      });
    },

    load(id) {
      if (id === RESOLVED_MANIFEST_ID) {
        return `export default ${JSON.stringify(navigationManifest)};`;
      }
      if (id.startsWith(RESOLVED_CONTENT_PREFIX)) {
        const index = Number(id.slice(RESOLVED_CONTENT_PREFIX.length));
        return `export default ${JSON.stringify(contentEntries[index]?.blocks ?? [])};`;
      }
      if (id !== RESOLVED_ID) {
        return undefined;
      }
      const contentMap = contentEntries
        .map(
          (entry, index) =>
            `  [${JSON.stringify(entry.key)}]: () => import(${JSON.stringify(`${CONTENT_ID_PREFIX}${index}`)}),`,
        )
        .join('\n');
      return `
import manifest from ${JSON.stringify(MANIFEST_ID)};
import {
  getEntryMeta as _getEntryMeta,
  getFirstPage as _getFirstPage,
  getHeadings as _getHeadings,
  getOptionsRegistry as _getOptionsRegistry,
  getOptionsGroup as _getOptionsGroup,
  getPagination as _getPagination,
  getSidebarNodes as _getSidebarNodes,
} from '@yapyak/doc-compiler';

const content = {
${contentMap}
};

export const doc = {
  manifest,
  getEntry: async (collection, path = '') => {
    const entry = _getEntryMeta(manifest, collection, path);
    if (entry.kind !== 'page') {
      return entry;
    }
    const { default: blocks } = await content[JSON.stringify([collection, path])]();
    return {
      kind: 'page',
      page: entry.page,
      blocks,
    };
  },
  getPagination: (page) => _getPagination(manifest, page),
  getSidebarNodes: (collection) => _getSidebarNodes(manifest, collection),
  getFirstPage: (collection) => _getFirstPage(manifest, collection),
  getOptionsRegistry: () => _getOptionsRegistry(manifest),
  getOptionsGroup: (groupId) => _getOptionsGroup(manifest, groupId),
  getHeadings: _getHeadings,
};
`;
    },

    name: '@yapyak/doc-compiler',

    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_ID;
      }
      if (id === MANIFEST_ID) {
        return RESOLVED_MANIFEST_ID;
      }
      if (id.startsWith(CONTENT_ID_PREFIX)) {
        return `\0${id}`;
      }
      return undefined;
    },
  };
}

type ContentEntry = {
  blocks: Block[];
  key: string;
};

type SplitManifestResult = {
  contentEntries: ContentEntry[];
  navigationManifest: NavigationManifest;
};

function splitManifest(manifest: Manifest): SplitManifestResult {
  const contentEntries: ContentEntry[] = [];
  const collections: Record<string, NavigationCollection> = {};
  for (const [collectionName, collection] of Object.entries(
    manifest.collections,
  )) {
    for (const [path, blocks] of Object.entries(collection.content)) {
      contentEntries.push({
        blocks,
        key: JSON.stringify([
          collectionName,
          path,
        ]),
      });
    }
    collections[collectionName] = {
      pages: collection.pages,
      redirects: collection.redirects,
      sidebarNodes: collection.sidebarNodes,
    };
  }
  return {
    contentEntries,
    navigationManifest: {
      collections,
      options: manifest.options,
      symbols: manifest.symbols,
      version: manifest.version,
    },
  };
}

function invalidateVirtualModules(server: ViteDevServer) {
  for (const module of server.moduleGraph.idToModuleMap.values()) {
    if (module.id?.startsWith(RESOLVED_ID)) {
      server.moduleGraph.invalidateModule(module);
    }
  }
  server.ws.send({
    type: 'full-reload',
  });
}

function getWatchedDirectories(config: Config): string[] {
  const directories: string[] = [];
  for (const collection of Object.values(config.collections)) {
    if (collection.source === 'markdown') {
      directories.push(resolve(collection.root));
    } else {
      for (const typescriptPackage of collection.packages) {
        directories.push(resolve(typescriptPackage.root, 'src'));
      }
    }
  }
  return directories;
}

function isRelevantFile(file: string, watchedDirectories: string[]): boolean {
  const normalized = resolve(file);
  return watchedDirectories.some(
    (directory) =>
      normalized === directory || normalized.startsWith(directory + sep),
  );
}

function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}
