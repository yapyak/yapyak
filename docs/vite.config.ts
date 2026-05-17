import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

import { apiManifest } from './src/lib/reference/api-manifest-plugin.ts';
import { resolve } from 'node:path';

const yapyakDir = resolve(import.meta.dirname, '..', 'packages', 'yapyak');

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    apiManifest({
      outFile: resolve(
        import.meta.dirname,
        'content',
        'reference',
        'api-manifest.json',
      ),
      yapyakDir,
    }),
    yapyak(),
    tanstackStart(),
  ],
  server: {
    port: 3000,
  },
});
