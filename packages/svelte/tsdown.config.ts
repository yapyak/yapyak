import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  entry: [
    'src/processor.ts',
  ],
  external: [
    'svelte',
  ],
});
