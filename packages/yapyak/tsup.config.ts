import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/internal/index.ts',
    'src/vite/index.ts',
    'src/react/index.ts',
    'src/vue/index.ts',
    'src/svelte/index.ts',
    'src/translator/index.ts',
    'src/adapter/index.ts',
    'src/adapter/astro.ts',
    'src/adapter/react-router.ts',
    'src/adapter/sveltekit.ts',
    'src/adapter/tanstack-start.ts',
    'src/cli/run.ts',
  ],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['astro:middleware', 'virtual:yapyak'],
});
