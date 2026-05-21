import type { Plugin } from 'vite';

import { extract } from './extract.server.ts';
import { invalidateManifest } from './manifest.server.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface ReferenceManifestOptions {
  outFile: string;
  yapyakDir: string;
}

export function referenceManifest(options: ReferenceManifestOptions): Plugin {
  const yapyakSrcDir = resolve(options.yapyakDir, 'src');
  let generating: Promise<void> | null = null;

  async function generate() {
    const manifest = await extract(options.yapyakDir);
    const payload = JSON.stringify(manifest, null, 2);
    await mkdir(dirname(options.outFile), { recursive: true });
    await writeFile(options.outFile, `${payload}\n`, 'utf8');
    invalidateManifest();
  }

  function schedule() {
    if (generating !== null) {
      return;
    }
    generating = generate()
      .catch((error: unknown) => {
        process.stderr.write(
          `[reference-manifest] generation failed: ${String(error)}\n`,
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
    name: 'yapyak-reference-manifest',
  };
}
