import { defineConfig } from '@yapyak/vitest-config';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  exclude: [
    ...configDefaults.exclude,
    '.vscode-test/**',
    'e2e/**',
  ],
});
