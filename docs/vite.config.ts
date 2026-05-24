import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { docExtractor } from '@yapyak/doc-extractor/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

import { resolve } from 'node:path';

const REFERENCE_PACKAGES = [
  'core',
  'compiler',
  'vite',
  'react',
  'vue',
  'svelte',
  'astro',
  'tanstack-start',
  'sveltekit',
  'react-router',
  'anthropic',
  'openai',
  'gemini',
  'ollama',
];

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
          packages: REFERENCE_PACKAGES.map((name) => ({
            root: resolve(import.meta.dirname, `../packages/${name}`),
          })),
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
