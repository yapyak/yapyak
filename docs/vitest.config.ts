import { defineConfig } from '@yapyak/vitest-config';
import { configDefaults, mergeConfig } from 'vitest/config';

export default mergeConfig(defineConfig(), {
  test: {
    exclude: [
      ...configDefaults.exclude,
      'doc-compiler/**',
    ],
  },
});
