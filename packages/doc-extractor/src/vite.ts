import type { Plugin, ViteDevServer } from 'vite';
import type { Config } from './config';

import { buildManifest } from './build/manifest';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const VIRTUAL_ID = 'virtual:doc-extractor';
const RESOLVED_ID = '\0virtual:doc-extractor';
const REBUILD_DEBOUNCE_MS = 200;

export function docExtractor(config: Config): Plugin {
  let outAbsolute = '';

  const writeManifestFile = async () => {
    const manifest = await buildManifest(config);
    await mkdir(dirname(outAbsolute), {
      recursive: true,
    });
    await writeFile(outAbsolute, JSON.stringify(manifest, null, 2));
  };

  return {
    async buildStart() {
      outAbsolute = resolve(config.out);
      await writeManifestFile();
    },

    configureServer(server: ViteDevServer) {
      outAbsolute = resolve(config.out);

      const rebuild = debounce(async () => {
        try {
          await writeManifestFile();
          invalidateVirtualModule(server);
        } catch (error) {
          server.config.logger.error(
            `[doc-extractor] rebuild failed: ${String(error)}`,
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
      const manifestPath = JSON.stringify(outAbsolute);
      return `
import manifest from ${manifestPath};
import {
  findAdjacentPages as _findAdjacentPages,
  getEntry as _getEntry,
  getFirstPage as _getFirstPage,
  getHeadings as _getHeadings,
  getOptions as _getOptions,
  getOptionsGroup as _getOptionsGroup,
  getSidebar as _getSidebar,
} from '@yapyak/doc-extractor';

export const doc = {
  manifest,
  getEntry: (collection, path) => _getEntry(manifest, collection, path),
  findAdjacentPages: (page) => _findAdjacentPages(manifest, page),
  getSidebar: (collection) => _getSidebar(manifest, collection),
  getFirstPage: (collection) => _getFirstPage(manifest, collection),
  getOptions: () => _getOptions(manifest),
  getOptionsGroup: (groupId) => _getOptionsGroup(manifest, groupId),
  getHeadings: _getHeadings,
};
`;
    },

    name: '@yapyak/doc-extractor',

    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_ID;
      }
      return undefined;
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
  return watchedDirectories.some((directory) =>
    normalized.startsWith(directory),
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
