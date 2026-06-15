import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'vite',
      'vitest',
      'vitest/config',
    ],
  },
  entry: [
    'src/index.ts',
  ],
});
