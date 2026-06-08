import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.test.ts',
        '**/*.test-d.ts',
        '**/fixture/**',
        '**/dist/**',
        '**/node_modules/**',
      ],
      include: ['packages/*/src/**'],
      provider: 'v8',
    },
    projects: ['packages/*'],
  },
});
