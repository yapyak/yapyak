import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { docExtractor } from '@yapyak/doc-extractor/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

import { resolve } from 'node:path';

interface ReferencePackage {
  collapsible?: boolean;
  dir: string;
  group?: string;
  subpaths?: string[];
}

const REFERENCE_PACKAGES: ReferencePackage[] = [
  {
    collapsible: true,
    dir: 'yapyak',
    subpaths: ['./adapter', './config', './processor', './translator'],
  },

  { dir: 'vite', group: 'Bundlers' },

  {
    dir: 'react',
    group: 'Frameworks',
  },
  { dir: 'vue', group: 'Frameworks', subpaths: ['./processor'] },
  { dir: 'svelte', group: 'Frameworks', subpaths: ['./processor'] },

  { dir: 'astro', group: 'Adapters', subpaths: ['./processor'] },
  { dir: 'tanstack-start', group: 'Adapters' },
  { dir: 'sveltekit', group: 'Adapters' },
  { dir: 'react-router', group: 'Adapters' },

  { dir: 'anthropic', group: 'Translators' },
  { dir: 'openai', group: 'Translators' },
  { dir: 'gemini', group: 'Translators' },
  { dir: 'ollama', group: 'Translators' },
];

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    tanstackStart({
      prerender: {
        crawlLinks: true,
        enabled: true,
        failOnError: true,
      },
    }),
    react(),

    docExtractor({
      collections: {
        guide: {
          root: resolve(import.meta.dirname, 'content/guide'),
          source: 'markdoc',
        },
        reference: {
          packages: REFERENCE_PACKAGES.map((pkg) => ({
            collapsible: pkg.collapsible ?? !!pkg.group,
            group: pkg.group,
            name: pkg.dir,
            root: resolve(import.meta.dirname, `../packages/${pkg.dir}`),
            subpaths: pkg.subpaths,
          })),
          source: 'typedoc',
        },
      },
      out: resolve(import.meta.dirname, 'manifest.json'),
      sourceUrl: {
        template: 'https://github.com/yapyak/yapyak/blob/main/{path}#L{line}',
        workspaceRoot: resolve(import.meta.dirname, '..'),
      },
    }),
    yapyak(),
  ],
  server: {
    port: 3000,
  },
});
