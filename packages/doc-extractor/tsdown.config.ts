import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/vite.ts',
  ],
  external: [
    'vite',
  ],
});
