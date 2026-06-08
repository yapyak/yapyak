import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

import { resolve } from 'node:path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      'yapyak/runtime': resolve(
        import.meta.dirname,
        '../yapyak/src/runtime.ts',
      ),
    },
  },
  test: {
    setupFiles: [resolve(import.meta.dirname, '../../vitest.setup.ts')],
  },
});
