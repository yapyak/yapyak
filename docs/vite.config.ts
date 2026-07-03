import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { docCompiler } from '@yapyak/doc-compiler/vite';
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
    subpaths: [
      './processor',
    ],
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
    {
      enforce: 'post',
      generateBundle(_options, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'asset' && file.fileName.endsWith('.css')) {
            const css =
              typeof file.source === 'string'
                ? file.source
                : new TextDecoder().decode(file.source);
            file.source = `@layer reset, tokens, base, components;\n${css}`;
          }
        }
      },
      name: 'preserve-css-layer-order',
    },
    tanstackStart({
      prerender: {
        concurrency: 1,
        crawlLinks: true,
        enabled: true,
        failOnError: true,
        filter: (page) => {
          if (!page.fromCrawl) {
            return true;
          }
          const basepath = process.env.DOCS_BASEPATH ?? '/';
          const stripped =
            basepath === '/'
              ? page.path
              : page.path.replace(
                  new RegExp(`^${basepath.replace(/\/$/, '')}`),
                  '',
                );
          const path = stripped === '' ? '/' : stripped;
          return (
            path === '/' ||
            path.startsWith('/home') ||
            path.startsWith('/guide') ||
            path.startsWith('/reference')
          );
        },
      },
    }),
    react(),
    docCompiler({
      agentArtifact: {
        description:
          'i18n that keeps up. For Vite apps that move at the speed of save.',
        instructions: [
          'yapyak uses the English source string as the translation key.',
          "Write `t('Sign up')`, never `t('auth.signupButton')`.",
          'Source files: `t()` calls in TS/JS/JSX/TSX/Vue/Svelte/Astro.',
          'Catalogs: JSON files in `localesDir` (default `locales/`).',
          'A translator is optional. If the user configures one (Anthropic, OpenAI, Gemini, Ollama, or custom), empty stubs are filled on save. Without a translator, stubs stay empty and the user fills them in by hand.',
          'yapyak only fills empty stubs. Existing translations are never overwritten.',
          'Large saves are guarded: when a single save adds more than `autoTranslateThreshold` strings (default 20), yapyak skips auto-translate and leaves stubs empty until the user runs `yapyak translate`.',
          'Every `t()` call is rewritten in place at build time. Locale catalogs code-split along Vite routes.',
        ].join('\n'),
        outDir: resolve(import.meta.dirname, 'dist/client'),
        siteName: 'yapyak',
        siteUrl: 'https://yapyak.dev',
      },
      collections: {
        guide: {
          root: resolve(import.meta.dirname, 'content/guide'),
          source: 'markdown',
        },
        reference: {
          packages: REFERENCE_PACKAGES.map((pkg) => ({
            collapsible: pkg.collapsible ?? Boolean(pkg.group),
            group: pkg.group,
            name: pkg.dir,
            root: resolve(import.meta.dirname, `../packages/${pkg.dir}`),
            subpaths: pkg.subpaths,
          })),
          source: 'typescript',
          supplements: [
            {
              collapsible: true,
              label: 'CLI',
              root: resolve(import.meta.dirname, 'content/cli'),
              slug: 'cli',
            },
            {
              collapsible: true,
              label: 'Diagnostics',
              root: resolve(import.meta.dirname, 'content/diagnostics'),
              slug: 'diagnostics',
            },
          ],
        },
      },
      options: {
        adapter: {
          default: 'none',
          label: 'Adapter',
          options: [
            {
              label: 'None',
              value: 'none',
            },
            {
              label: 'React Router',
              value: 'react-router',
            },
            {
              label: 'TanStack Start',
              value: 'tanstack-start',
            },
            {
              label: 'SvelteKit',
              value: 'sveltekit',
            },
          ],
        },
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
        packageManager: {
          default: 'npm',
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
        translator: {
          default: 'none',
          label: 'Translator',
          options: [
            {
              label: 'None',
              value: 'none',
            },
            {
              label: 'Anthropic',
              value: 'anthropic',
            },
            {
              label: 'OpenAI',
              value: 'openai',
            },
            {
              label: 'Gemini',
              value: 'gemini',
            },
            {
              label: 'Ollama',
              value: 'ollama',
            },
          ],
        },
      },
      out: resolve(import.meta.dirname, 'manifest.json'),
      searchData: {
        fileName: 'search-data.json',
      },
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
