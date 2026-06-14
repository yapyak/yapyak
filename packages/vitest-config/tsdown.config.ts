import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  external: [
    'vite',
    'vitest',
    'vitest/config',
  ],
});
