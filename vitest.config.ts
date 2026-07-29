import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.{d,test-d}.ts',
        '**/fixture/**',
        '**/{index,internal,type}.ts',
        'packages/{*-config,doc-compiler}/**',
      ],
      include: [
        'packages/*/src/**/*.{ts,tsx}',
      ],
      provider: 'v8',
      reporter: [
        'text-summary',
        'html',
        'lcov',
        'json-summary',
      ],
    },
    projects: [
      'packages/*',
      'docs',
    ],
  },
});
