import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.astro',
        '**/*.test-d.ts',
        '**/fixture/**',
        'packages/yapyak/src/runtime.ts',
        'packages/{doc-extractor,tsup-config,typescript-config,vitest-config}/**',
      ],
      include: [
        'packages/*/src/**',
      ],
    },
    projects: [
      'packages/*',
    ],
  },
});
