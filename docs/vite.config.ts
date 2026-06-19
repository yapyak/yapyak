import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { docExtractor } from '@yapyak/doc-extractor/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

import { resolve } from 'node:path';

type ReferencePackage = {
  collapsible?: boolean;
  dir: string;
  group?: string;
  subpaths?: string[];
};

const REFERENCE_PACKAGES: ReferencePackage[] = [
  {
    collapsible: true,
    dir: 'yapyak',
    subpaths: [
      './adapter',
      './config',
      './processor',
      './translator',
    ],
  },

  {
    dir: 'vite',
    group: 'Bundlers',
  },

  {
    dir: 'react',
    group: 'Frameworks',
  },
  {
    dir: 'vue',
    group: 'Frameworks',
    subpaths: [
      './processor',
    ],
  },
  {
    dir: 'svelte',
    group: 'Frameworks',
    subpaths: [
      './processor',
    ],
  },
  {
    dir: 'astro',
    group: 'Frameworks',
    subpaths: [
      './integration',
      './processor',
    ],
  },

  {
    dir: 'sveltekit',
    group: 'Adapters',
  },
  {
    dir: 'tanstack-start',
    group: 'Adapters',
  },
  {
    dir: 'react-router',
    group: 'Adapters',
  },

  {
    dir: 'anthropic',
    group: 'Translators',
  },
  {
    dir: 'openai',
    group: 'Translators',
  },
  {
    dir: 'gemini',
    group: 'Translators',
  },
  {
    dir: 'ollama',
    group: 'Translators',
  },
];

export default defineConfig({
  base: process.env.DOCS_BASEPATH ?? '/',
  css: {
    transformer: 'lightningcss',
  },
  plugins: [
    tanstackStart({
      prerender: {
        concurrency: 1,
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
            collapsible: pkg.collapsible ?? Boolean(pkg.group),
            group: pkg.group,
            name: pkg.dir,
            root: resolve(import.meta.dirname, `../packages/${pkg.dir}`),
            subpaths: pkg.subpaths,
          })),
          source: 'typedoc',
        },
      },
      options: {
        framework: {
          default: 'react',
          label: 'Framework',
          options: [
            {
              label: 'React',
              value: 'react',
            },
            {
              label: 'Vue',
              value: 'vue',
            },
            {
              label: 'Svelte',
              value: 'svelte',
            },
            {
              label: 'Astro',
              value: 'astro',
            },
          ],
        },
        pkg: {
          default: 'pnpm',
          label: 'Package manager',
          options: [
            {
              label: 'npm',
              value: 'npm',
            },
            {
              label: 'pnpm',
              value: 'pnpm',
            },
            {
              label: 'bun',
              value: 'bun',
            },
          ],
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
