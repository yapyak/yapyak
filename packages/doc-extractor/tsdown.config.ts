import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'typescript',
      'vite',
    ],
  },
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite.ts',
  },
});
