import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
  external: [
    'vue',
    '@vue/compiler-core',
    '@vue/compiler-sfc',
  ],
});
