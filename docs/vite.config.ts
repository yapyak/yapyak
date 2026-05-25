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
  { dir: 'runtime', name: 'Runtime' },

  { dir: 'react', group: 'Frameworks', name: 'React' },
  { dir: 'vue', group: 'Frameworks', name: 'Vue' },
  { dir: 'svelte', group: 'Frameworks', name: 'Svelte' },

  { dir: 'adapter', group: 'Adapters', name: 'Adapter' },
  { dir: 'astro', group: 'Adapters', name: 'Astro' },
  { dir: 'tanstack-start', group: 'Adapters', name: 'TanStack Start' },
  { dir: 'sveltekit', group: 'Adapters', name: 'SvelteKit' },
  { dir: 'react-router', group: 'Adapters', name: 'React Router' },

  { dir: 'translator', group: 'Translators', name: 'Translator' },
  { dir: 'anthropic', group: 'Translators', name: 'Anthropic' },
  { dir: 'openai', group: 'Translators', name: 'OpenAI' },
  { dir: 'gemini', group: 'Translators', name: 'Gemini' },
  { dir: 'ollama', group: 'Translators', name: 'Ollama' },

  { dir: 'compiler', group: 'Tooling', name: 'Compiler' },
  { dir: 'config', group: 'Tooling', name: 'Config' },
  { dir: 'vite', group: 'Tooling', name: 'Vite' },
  { dir: 'cli', group: 'Tooling', name: 'CLI' },
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
            collapsible: !!pkg.group,
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
