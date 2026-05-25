import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { docExtractor } from '@yapyak/doc-extractor/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

import { resolve } from 'node:path';

interface ReferencePackage {
  dir: string;
  group?: string;
  name: string;
}

const REFERENCE_PACKAGES: ReferencePackage[] = [
  { dir: 'core', name: 'Core' },

  { dir: 'compiler', group: 'Tooling', name: 'Compiler' },
  { dir: 'vite', group: 'Tooling', name: 'Vite plugin' },
  { dir: 'cli', group: 'Tooling', name: 'CLI' },

  { dir: 'react', group: 'Frameworks', name: 'React' },
  { dir: 'vue', group: 'Frameworks', name: 'Vue' },
  { dir: 'svelte', group: 'Frameworks', name: 'Svelte' },

  { dir: 'astro', group: 'Integrations', name: 'Astro' },
  { dir: 'tanstack-start', group: 'Integrations', name: 'TanStack Start' },
  { dir: 'sveltekit', group: 'Integrations', name: 'SvelteKit' },
  { dir: 'react-router', group: 'Integrations', name: 'React Router' },

  { dir: 'adapter', group: 'Translators', name: 'Adapter' },
  { dir: 'translator', group: 'Translators', name: 'Translator' },
  { dir: 'anthropic', group: 'Translators', name: 'Anthropic' },
  { dir: 'openai', group: 'Translators', name: 'OpenAI' },
  { dir: 'gemini', group: 'Translators', name: 'Gemini' },
  { dir: 'ollama', group: 'Translators', name: 'Ollama' },
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
          packages: REFERENCE_PACKAGES.map((pkg) => ({
            collapsible: pkg.group !== undefined,
            expanded: false,
            group: pkg.group,
            name: pkg.name,
            root: resolve(import.meta.dirname, `../packages/${pkg.dir}`),
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
