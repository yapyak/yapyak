import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.astro',
        '**/*.svelte',
        '**/*.test-d.ts',
        '**/bin.ts',
        '**/fixture/**',
        'packages/*/src/runtime.ts',
        'packages/{doc-extractor,tsdown-config,typescript-config,vitest-config}/**',
        'packages/{react,vue,svelte}/src/hmr-patch.ts',
        'packages/vue/src/dev-version.ts',
        'packages/svelte/src/dev-version.svelte.ts',
      ],
      include: [
        'packages/*/src/**/*.{ts,tsx}',
      ],
    },
    projects: [
      'packages/*',
    ],
  },
});
