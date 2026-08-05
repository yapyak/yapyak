import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      '@sveltejs/kit',
    ],
  },
  entry: [
    'src/index.ts',
  ],
});
