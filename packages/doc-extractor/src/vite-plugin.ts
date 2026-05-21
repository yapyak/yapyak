import type { Plugin, ViteDevServer } from 'vite';
import type { Config } from './types/config.ts';

import { buildManifest } from './build/manifest.ts';
import { debounce } from './utils/debounce.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

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
    name: '@yapyak/doc-extractor',
  };
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
