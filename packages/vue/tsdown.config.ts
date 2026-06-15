import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'vue',
      '@vue/compiler-core',
      '@vue/compiler-sfc',
    ],
  },
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
});
