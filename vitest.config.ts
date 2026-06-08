import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/fixture/**', '**/*.test-d.ts'],
      include: ['packages/*/src/**'],
    },
    projects: ['packages/*'],
  },
});
