import type { Plugin, ViteDevServer } from 'vite';
import type { Block } from './access';
import type {
  Manifest,
  NavigationCollection,
  NavigationManifest,
  PageMeta,
} from './build';
import type { Config } from './config';

import { buildAgentArtifact, buildManifest, buildSearchData } from './build';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

const VIRTUAL_ID = 'virtual:doc-compiler';
const RESOLVED_ID = '\0virtual:doc-compiler';
const REBUILD_DEBOUNCE_MS = 200;

export function docCompiler(config: Config): Plugin {
  let outAbsolute = '';
  let bodiesDirectory = '';
  let bodyEntries: {
    file: string;
    key: string;
  }[] = [];
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

  const writeManifestFile = async () => {
    const manifest = await getManifest();
    const { bodies, navManifest } = splitManifest(manifest);
    await mkdir(dirname(outAbsolute), {
      recursive: true,
    });
    await writeFile(outAbsolute, JSON.stringify(navManifest, null, 2));
    await rm(bodiesDirectory, {
      force: true,
      recursive: true,
    });
    await mkdir(bodiesDirectory, {
      recursive: true,
    });
    bodyEntries = await Promise.all(
      bodies.map(async (body, index) => {
        const file = resolve(bodiesDirectory, `${index}.js`);
        await writeFile(
          file,
          `export default ${JSON.stringify(body.blocks)};\n`,
        );
        return {
          file,
          key: body.key,
        };
      }),
    );
  };

  return {
    async buildStart() {
      outAbsolute = resolve(config.out);
      bodiesDirectory = resolve(dirname(outAbsolute), 'bodies');
      await writeManifestFile();
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
      outAbsolute = resolve(config.out);
      bodiesDirectory = resolve(dirname(outAbsolute), 'bodies');

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
          await writeManifestFile();
          invalidateVirtualModule(server);
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
      if (id !== RESOLVED_ID) {
        return undefined;
      }
      const bodyMap = bodyEntries
        .map(
          (entry) =>
            `  [${JSON.stringify(entry.key)}]: () => import(${JSON.stringify(entry.file)}),`,
        )
        .join('\n');
      return `
import manifest from ${JSON.stringify(outAbsolute)};
import {
  findAdjacentPages as _findAdjacentPages,
  getEntryMeta as _getEntryMeta,
  getFirstPage as _getFirstPage,
  getHeadings as _getHeadings,
  getOptions as _getOptions,
  getOptionsGroup as _getOptionsGroup,
  getSidebar as _getSidebar,
} from '@yapyak/doc-compiler';

const bodies = {
${bodyMap}
};

export const doc = {
  manifest,
  getEntry: async (collection, path = '') => {
    const entry = _getEntryMeta(manifest, collection, path);
    if (entry.kind !== 'page') {
      return entry;
    }
    const { default: blocks } = await bodies[JSON.stringify([collection, path])]();
    return {
      kind: 'page',
      page: { ...entry.page, blocks },
    };
  },
  findAdjacentPages: (page) => _findAdjacentPages(manifest, page),
  getSidebar: (collection) => _getSidebar(manifest, collection),
  getFirstPage: (collection) => _getFirstPage(manifest, collection),
  getOptions: () => _getOptions(manifest),
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
      return undefined;
    },
  };
}

type PageBody = {
  blocks: Block[];
  key: string;
};

function splitManifest(manifest: Manifest): {
  bodies: PageBody[];
  navManifest: NavigationManifest;
} {
  const bodies: PageBody[] = [];
  const collections: Record<string, NavigationCollection> = {};
  for (const [collectionName, collection] of Object.entries(
    manifest.collections,
  )) {
    const pages: Record<string, PageMeta> = {};
    for (const [path, page] of Object.entries(collection.pages)) {
      const { blocks, ...pageMeta } = page;
      pages[path] = pageMeta;
      bodies.push({
        blocks,
        key: JSON.stringify([
          collectionName,
          path,
        ]),
      });
    }
    collections[collectionName] = {
      pages,
      redirects: collection.redirects,
      sidebar: collection.sidebar,
    };
  }
  return {
    bodies,
    navManifest: {
      collections,
      options: manifest.options,
      symbols: manifest.symbols,
      version: manifest.version,
    },
  };
}

function invalidateVirtualModule(server: ViteDevServer) {
  const module = server.moduleGraph.getModuleById(RESOLVED_ID);
  if (module !== undefined) {
    server.moduleGraph.invalidateModule(module);
    server.ws.send({
      type: 'full-reload',
    });
  }
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
