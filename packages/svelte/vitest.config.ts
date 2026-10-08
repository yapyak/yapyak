import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from '@yapyak/vitest-config';

export default defineConfig({
  environment: 'happy-dom',
  locales: [
    'en',
    'sv',
    'ar',
  ],
  plugins: [
    svelte(),
    svelteTesting(),
    {
      config: () => ({
        resolve: {
          alias: [
            {
              find: /^oxc-parser$/,
              replacement: 'oxc-parser/src-js/index.js',
            },
          ],
        },
      }),
      name: 'yapyak:oxc-parser-node-entry',
    },
  ],
});
