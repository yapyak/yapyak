import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { docExtractor } from '@yapyak/doc-extractor/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

import { resolve } from 'node:path';

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    docExtractor({
      collections: {
        guide: {
          root: resolve(import.meta.dirname, 'content/guide'),
          source: 'markdoc',
        },
        reference: {
          intro: resolve(
            import.meta.dirname,
            'content/reference/introduction.md',
          ),
          packageDir: resolve(import.meta.dirname, '../packages/yapyak'),
          source: 'typedoc',
        },
      },
      out: resolve(import.meta.dirname, 'manifest.json'),
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
