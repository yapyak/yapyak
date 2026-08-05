import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'vite',
    ],
  },
  entry: [
    'src/index.ts',
  ],
});
