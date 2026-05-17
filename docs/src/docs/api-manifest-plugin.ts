import type { Plugin } from 'vite';

import { extractApi } from './extract-api';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface Options {
  outFile: string;
  yapyakDir: string;
}

export function apiManifest(options: Options): Plugin {
  const yapyakSrcDir = resolve(options.yapyakDir, 'src');
  let generating: Promise<void> | null = null;

  async function generate() {
    const manifest = await extractApi(options.yapyakDir);
    const payload = JSON.stringify(manifest, null, 2);
    await mkdir(dirname(options.outFile), { recursive: true });
    await writeFile(options.outFile, `${payload}\n`, 'utf8');
  }

  function schedule() {
    if (generating !== null) {
      return;
    }
    generating = generate()
      .catch((error: unknown) => {
        process.stderr.write(
          `[api-manifest] generation failed: ${String(error)}\n`,
        );
      })
      .finally(() => {
        generating = null;
      });
  }

  return {
    async buildStart() {
      await generate();
    },
    configureServer(server) {
      server.watcher.add(yapyakSrcDir);
      server.watcher.on('change', (path) => {
        if (path.startsWith(yapyakSrcDir) && path.endsWith('.ts')) {
          schedule();
        }
      });
      server.watcher.on('add', (path) => {
        if (path.startsWith(yapyakSrcDir) && path.endsWith('.ts')) {
          schedule();
        }
      });
    },
    name: 'yapyak-api-manifest',
  };
}
