import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'svelte',
    ],
  },
  entry: [
    'src/processor.ts',
  ],
});
