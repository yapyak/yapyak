import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.{d,test-d}.ts',
        '**/bin.ts',
        '**/fixture/**',
        '**/{index,internal,type}.ts',
        'packages/*-config/**',
        'packages/vscode/**',
        'packages/yapyak/src/runtime.ts',
        'packages/{react,svelte,vue}/src/{dev-version,hmr-patch}.*',
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
      thresholds: {
        branches: 88,
        functions: 97,
        lines: 94,
        statements: 94,
      },
    },
    projects: [
      'packages/*',
      'docs',
      'docs/compiler',
    ],
  },
});
