import { resolve } from 'node:path';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { apiManifest } from './src/docs/api-manifest-plugin.ts';

const yapyakDir = resolve(import.meta.dirname, '..');

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    apiManifest({
      yapyakDir,
      outFile: resolve(
        import.meta.dirname,
        'content',
        'reference',
        'api-manifest.json',
      ),
    }),
    yapyak(),
    tanstackStart(),
  ],
  server: {
    port: 3000,
  },
});
