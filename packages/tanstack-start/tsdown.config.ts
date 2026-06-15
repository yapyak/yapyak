import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      '@tanstack/react-start',
    ],
  },
  entry: [
    'src/index.ts',
  ],
});
