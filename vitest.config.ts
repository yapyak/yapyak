import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      exclude: [
        '**/*.test.ts',
        '**/*.test-d.ts',
        '**/fixture/**',
        '**/dist/**',
        '**/node_modules/**',
      ],
    },
  },
});
