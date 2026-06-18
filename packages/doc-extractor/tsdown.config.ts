import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'vite',
    ],
  },
  entry: {
    'extract-worker': 'src/extract/typedoc/extract-worker.ts',
    index: 'src/index.ts',
    vite: 'src/vite.ts',
  },
});
