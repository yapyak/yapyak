import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { docCompiler } from '@yapyak/docs-compiler/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

import { resolve } from 'node:path';

type ReferencePackage = {
  collapsible?: boolean;
  dir: string;
  group?: string;
  label: string;
  subpaths?: string[];
};

const REFERENCE_PACKAGES: ReferencePackage[] = [
  {
    collapsible: true,
    dir: 'yapyak',
    label: 'yapyak',
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
    label: 'Vite',
  },

  {
    dir: 'react',
    group: 'Frameworks',
    label: 'React',
    subpaths: [
      './processor',
    ],
  },
  {
    dir: 'vue',
    group: 'Frameworks',
    label: 'Vue',
    subpaths: [
      './processor',
    ],
  },
  {
    dir: 'svelte',
    group: 'Frameworks',
    label: 'Svelte',
    subpaths: [
      './processor',
    ],
  },
  {
    dir: 'astro',
    group: 'Frameworks',
    label: 'Astro',
    subpaths: [
      './integration',
      './processor',
    ],
  },

  {
    dir: 'nuxt',
    group: 'Adapters',
    label: 'Nuxt',
    subpaths: [
      './processor',
    ],
  },
  {
    dir: 'sveltekit',
    group: 'Adapters',
    label: 'SvelteKit',
  },
  {
    dir: 'tanstack-start',
    group: 'Adapters',
    label: 'TanStack Start',
  },
  {
    dir: 'react-router',
    group: 'Adapters',
    label: 'React Router',
  },

  {
    dir: 'anthropic',
    group: 'Translators',
    label: 'Anthropic',
  },
  {
    dir: 'openai',
    group: 'Translators',
    label: 'OpenAI',
  },
  {
    dir: 'gemini',
    group: 'Translators',
    label: 'Gemini',
  },
  {
    dir: 'ollama',
    group: 'Translators',
    label: 'Ollama',
  },
  {
    dir: 'claude-code',
    group: 'Translators',
    label: 'Claude Code',
  },
];

const FRAMEWORK_PACKAGES = REFERENCE_PACKAGES.filter(
  (pkg) => pkg.group === 'Frameworks',
);
const TRANSLATOR_PACKAGES = REFERENCE_PACKAGES.filter(
  (pkg) => pkg.group === 'Translators',
);

export default defineConfig({
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
          return (
            page.path === '/' ||
            page.path.startsWith('/guide') ||
            page.path.startsWith('/reference')
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
          `Source files: \`t()\` calls in TS/JS and ${FRAMEWORK_PACKAGES.map((pkg) => pkg.label).join('/')} components.`,
          'Catalogs: JSON files in `localesDir`.',
          `A translator is optional. If the user configures one (${TRANSLATOR_PACKAGES.map((pkg) => pkg.label).join(', ')}, or custom), empty stubs are filled on save. Without a translator, stubs stay empty and the user fills them in by hand.`,
          'yapyak only fills empty stubs. Existing translations are never overwritten.',
          'Large saves are guarded: when a single save adds more than `autoTranslateThreshold` strings, yapyak skips auto-translate and leaves stubs empty until the user runs `yapyak translate`.',
          'Every `t()` call is rewritten in place at build time. Locale catalogs code-split along Vite routes.',
        ].join('\n'),
        outDir: resolve(import.meta.dirname, 'dist/client'),
        siteName: 'yapyak',
        siteUrl: 'https://yapyak.dev',
      },
      collections: {
        guide: {
          kind: 'markdown',
          root: resolve(import.meta.dirname, 'content/guide'),
        },
        reference: {
          kind: 'typescript',
          packages: REFERENCE_PACKAGES.map((pkg) => ({
            collapsible: pkg.collapsible ?? Boolean(pkg.group),
            group: pkg.group,
            name: pkg.dir,
            root: resolve(import.meta.dirname, `../packages/${pkg.dir}`),
            subpaths: pkg.subpaths,
          })),
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
              label: 'Nuxt',
              value: 'nuxt',
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
          options: FRAMEWORK_PACKAGES.map((pkg) => ({
            label: pkg.label,
            value: pkg.dir,
          })),
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
            ...TRANSLATOR_PACKAGES.map((pkg) => ({
              label: pkg.label,
              value: pkg.dir,
            })),
          ],
        },
      },
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
