import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

import { referenceManifest } from './src/lib/reference/reference-manifest-plugin.ts';
import { resolve } from 'node:path';

const yapyakDir = resolve(import.meta.dirname, '..', 'packages', 'yapyak');

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    referenceManifest({
      outFile: resolve(
        import.meta.dirname,
        'content',
        'reference',
        'manifest.json',
      ),
      yapyakDir,
    }),
    yapyak(),
    tanstackStart({
      prerender: {
        crawlLinks: true,
        enabled: true,
        failOnError: true,
      },
    }),
  ],
  server: {
    port: 3000,
  },
});
