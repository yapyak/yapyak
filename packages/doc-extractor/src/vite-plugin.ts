import type { Plugin, ViteDevServer } from 'vite';
import type { Config } from './types/config.ts';

import { buildManifest } from './build/manifest.ts';
import { debounce } from './utils/debounce.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const VIRTUAL_ID = 'virtual:doc-extractor';
const RESOLVED_ID = '\0virtual:doc-extractor';

export function docExtractor(options: Config): Plugin {
  let outAbsolute = '';

  const writeManifestFile = async () => {
    const manifest = await buildManifest(options);
    await mkdir(dirname(outAbsolute), { recursive: true });
    await writeFile(outAbsolute, JSON.stringify(manifest, null, 2));
  };

  return {
    async buildStart() {
      outAbsolute = resolve(options.out);
      await writeManifestFile();
    },

    configureServer(server: ViteDevServer) {
      outAbsolute = resolve(options.out);

      const rebuild = debounce(async () => {
        try {
          await writeManifestFile();
          invalidateVirtualModule(server);
        } catch (error) {
          server.config.logger.error(
            `[doc-extractor] rebuild failed: ${String(error)}`,
          );
        }
      }, 200);

      const watchedDirectories = collectWatchedDirectories(options);
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
  blockToText as _blockToText,
  findAdjacentPages as _findAdjacentPages,
  getAllPages as _getAllPages,
  getCodeBlocks as _getCodeBlocks,
  getCollection as _getCollection,
  getEntry as _getEntry,
  getExcerpt as _getExcerpt,
  getFirstPage as _getFirstPage,
  getHeadings as _getHeadings,
  getInternalLinks as _getInternalLinks,
  getPage as _getPage,
  getSidebar as _getSidebar,
  getText as _getText,
  isBlock as _isBlock,
  resolveSymbol as _resolveSymbol,
  walkBlocks as _walkBlocks,
} from '@yapyak/doc-extractor';

export const doc = {
  manifest,
  getPage: (collection, path) => _getPage(manifest, collection, path),
  getEntry: (collection, path) => _getEntry(manifest, collection, path),
  findAdjacentPages: (page) => _findAdjacentPages(manifest, page),
  getSidebar: (collection) => _getSidebar(manifest, collection),
  resolveSymbol: (name) => _resolveSymbol(manifest, name),
  getAllPages: () => _getAllPages(manifest),
  getCollection: (collection) => _getCollection(manifest, collection),
  getFirstPage: (collection) => _getFirstPage(manifest, collection),
  getHeadings: _getHeadings,
  getText: _getText,
  getExcerpt: _getExcerpt,
  getInternalLinks: _getInternalLinks,
  getCodeBlocks: _getCodeBlocks,
  isBlock: _isBlock,
  blockToText: _blockToText,
  walkBlocks: _walkBlocks,
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
  const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
  if (mod !== undefined) {
    server.moduleGraph.invalidateModule(mod);
    server.ws.send({ type: 'full-reload' });
  }
}

function collectWatchedDirectories(config: Config): string[] {
  const directories: string[] = [];
  for (const collection of Object.values(config.collections)) {
    if (collection.source === 'markdoc') {
      directories.push(resolve(collection.root));
    } else {
      directories.push(resolve(collection.packageDir, 'src'));
      if (collection.intro !== undefined) {
        directories.push(resolve(dirname(collection.intro)));
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
